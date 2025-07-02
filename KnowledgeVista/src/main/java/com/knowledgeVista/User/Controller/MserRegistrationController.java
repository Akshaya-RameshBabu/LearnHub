package com.knowledgeVista.User.Controller;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.DownloadManagement.CustomerLeads;
import com.knowledgeVista.DownloadManagement.Customer_downloads;
import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.License.LicenseController;
import com.knowledgeVista.License.Madmin_Licence;
import com.knowledgeVista.License.mAdminLicenceRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.MuserAddInfoDto;
import com.knowledgeVista.User.MuserDto;
import com.knowledgeVista.User.MuserProfileDTO;
import com.knowledgeVista.User.MuserRequiredDto;
import com.knowledgeVista.User.MuserRoles;
import com.knowledgeVista.User.Approvals.MuserApprovalRepo;
import com.knowledgeVista.User.Approvals.MuserApprovals;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.Repository.MuserRoleRepository;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.User.SecurityConfiguration.OtpService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class MserRegistrationController {
	@Autowired
	private MuserRepositories muserrepositories;
	@Autowired
	private BCryptPasswordEncoder passwordEncoder;

	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private MuserRoleRepository muserrolerepository;

	@Autowired
	private LicenseController licencecontrol;
	@Autowired
	private MuserApprovalRepo MuserApproval;

	@Autowired
	private EmailService emailservice;
	@Autowired
	private mAdminLicenceRepo madminrepo;

	@Value("${spring.environment}")
	private String environment;

	@Value("${spring.profiles.active}")
	private String activeProfile;
	@Value("${base.url}")
	private String baseUrl;
	@Autowired
	private OtpService otpService;
	private static final Logger logger = LoggerFactory.getLogger(MserRegistrationController.class);

	@Autowired
	private JavaMailSender mailSender;

	@Value("${spring.mail.username}")
	private String emailUsername;

	public Long countadmin() {
		return muserrepositories.countByRoleName("ADMIN");
	}

	public ResponseEntity<?> registerAdmin(HttpServletRequest request, String username, String psw, String email,
			String institutionName, LocalDate dob, String role, String phone, String skills, MultipartFile profile,
			Boolean isActive, String countryCode, String otp) {
		try {
			if (!otpService.validateOtp(email, otp)) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
			}
			// Remove OTP after successful verification
			otpService.clearOtp(email);
			Long count = muserrepositories.count();
			if (environment.equals("VPS") && count > 1) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ADMIN");
			}
			Optional<Muser> existingUser = muserrepositories.findByEmail(email);

			Optional<Muser> existingInstitute = muserrepositories.findByInstitutionName(institutionName);

			if (existingUser.isPresent()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("EMAIL");
			}
			if (existingInstitute.isPresent()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("INSTITUTE");
			}

			Optional<MuserRoles> oproleUser = muserrolerepository.findByRoleName("ADMIN");
			if (oproleUser.isPresent()) {
				MuserRoles roleuser = oproleUser.get();
				if (username == null || username.trim().isEmpty()) {
					// Extract the part before '@' from the email
					if (email != null && email.contains("@")) {
						username = email.substring(0, email.indexOf("@"));
					}
				}
				Muser user = new Muser();
				user.setUsername(username);
				user.setEmail(email);
				// Store plain text password for email
				String plainTextPassword = psw;
				user.setPassword(psw, passwordEncoder);
				user.setIsActive(isActive);
				user.setPhone(phone);
				user.setDob(dob);
				user.setSkills(skills);
				user.setInstitutionName(institutionName);
				user.setCountryCode(countryCode);
				user.setRole(roleuser);

				if (profile != null && !profile.isEmpty()) {
					try {
						user.setProfile(profile.getBytes());

					} catch (IOException e) {
						e.printStackTrace();
						logger.error("", e);
						return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
								.body("{\"message\": \"Error compressing image\"}");
					}
				}
				Muser savedadmin = muserrepositories.save(user);
				if (environment.equals("SAS")) {
					Madmin_Licence madmin = new Madmin_Licence();
					madmin.setAdminId(savedadmin.getUserId());
					madmin.setInstitution(institutionName);
					madmin.setLicenceType("FREE");
					madminrepo.save(madmin);
					licencecontrol.uploadSAS(madmin, savedadmin);
				}
				List<String> bcc = null;
				List<String> cc = null;
				String institutionname = institutionName;

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

				// Email Body
				String body = String.format("<html>" + "<body>" + "<h2>Welcome to LearnHub Admin Portal!</h2>"
						+ "<p>Dear %s,</p>" + "<p>We are excited to welcome you as an administrator at LearnHub.</p>"
						+ "<p>Here are your login credentials:</p>" + "<ul>"
						+ "<li><strong>Username (Email):</strong> %s</li>" + "<li><strong>Password:</strong> %s</li>"
						+ "</ul>" + "<p>With your admin access, you can:</p>" + "<ul>"
						+ "<li>Add and manage courses.</li>" + "<li>Add and manage Student and Trainers.</li>"
						+ "<li>Approve the Registered Trainer.</li>" + "<li>Allot Courses For Trainers.</li>"
						+ "<li>Oversee Revenue Details.</li>" + "<li>Oversee student enrollments.</li>"
						+ "<li>Update course content.</li>" + "<li>Support students in their learning journey.</li>"
						+ "<li>And Many More.....</li>" + "</ul>"
						+ "<p>If you need any assistance, our support team is always here to help.</p>"
						+ "<p>Click the link below to sign in:</p>" + "<p><a href='" + signInLink
						+ "' style='font-size:16px; color:blue;'>Sign In</a></p>"
						+ "<p>We appreciate your dedication and look forward to a great collaboration!</p>"
						+ "<p>Best Regards,<br>LearnHub Team</p>" + "</body>" + "</html>", user.getUsername(), // Admin
																												// Name
						user.getEmail(), // Admin Username (email)
						plainTextPassword // Admin Password (plain text)
				);

				if (institutionname != null && !institutionname.isEmpty()) {
					try {
						List<String> emailList = new ArrayList<>();
						emailList.add(email);
						System.out.println("sending.." + email);
						emailservice.sendHtmlEmailAsync(institutionname, emailList, cc, bcc,
								"Welcome to LearnHub - Start Your Administrator Journey Today!", body);
					} catch (Exception e) {
						System.out.println("cant send email" + e.getMessage());
						logger.error("Error sending mail: " + e.getMessage());
					}
				}

				RestTemplate restTemplate = new RestTemplate();

				String apiUrl = baseUrl + "/Developer/CustomerDownloads";
				String apiUrl2 = baseUrl + "/Developer/CustomerLeads";

				Customer_downloads custDown = new Customer_downloads();
				custDown.setName(user.getUsername());
				custDown.setEmail(user.getEmail());
				custDown.setCountryCode(user.getCountryCode());
				custDown.setPhone(user.getPhone());

				CustomerLeads custlead = new CustomerLeads();
				custlead.setName(user.getUsername());
				custlead.setEmail(user.getEmail());
				custlead.setCountryCode(user.getCountryCode());
				custlead.setPhone(user.getPhone());

				try {
					restTemplate.postForEntity(apiUrl, custDown, String.class);
				} catch (Exception e) {
					// Log the error but do not send it to the frontend
					System.err.println("Error posting to CustomerDownloads: " + e.getMessage());
				}

				try {
					restTemplate.postForEntity(apiUrl2, custlead, String.class);
				} catch (Exception e) {
					// Log the error but do not send it to the frontend
					System.err.println("Error posting to CustomerLeads: " + e.getMessage());
				}
				return ResponseEntity.ok().body("{\"message\": \"saved Successfully\"}");
			} else {

				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
						.body("{\"message\": \"Error getting role\"}");

			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("{\"message\": \"Internal Server Error\"}");
		}
	}

	public ResponseEntity<?> RegisterStudent(HttpServletRequest request, String username, String psw, String email,
			LocalDate dob, String role, String phone, String skills, MultipartFile profile, Boolean isActive,
			String countryCode, String otp) {
		try {
			if (!otpService.validateOtp(email, otp)) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
			}
			// Remove OTP after successful verification
			otpService.clearOtp(email);
			// Continue with existing registration logic
			if (!environment.equals("VPS")) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST)
						.body("Cannot Register as Student in Sas Environment");
			}
			Long admincount = muserrepositories.countByRoleName("ADMIN");
			if (admincount == 0) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No Institution Found");
			}
			if (admincount > 1) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST)
						.body("Cannot Register as Student in Sas Environment");
			}
			Optional<Muser> existingUser = muserrepositories.findByEmail(email);

			String existingInstitute = muserrepositories.getInstitution("ADMIN");
			if (existingInstitute.isEmpty()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("institution not Found");
			}

			if (existingUser.isPresent()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("EMAIL");
			}

			Optional<MuserRoles> oproleUser = muserrolerepository.findByRoleName("USER");
			if (oproleUser.isPresent()) {
				MuserRoles roleuser = oproleUser.get();
				if (username == null || username.trim().isEmpty()) {
					// Extract the part before '@' from the email
					if (email != null && email.contains("@")) {
						username = email.substring(0, email.indexOf("@"));
					}
				}
				Muser user = new Muser();
				user.setUsername(username);
				user.setEmail(email);
				// Store plain text password for email
				String plainTextPassword = psw;
				user.setPassword(psw, passwordEncoder);
				user.setPhone(phone);
				user.setDob(dob);
				user.setSkills(skills);
				user.setInstitutionName(existingInstitute);
				user.setCountryCode(countryCode);
				user.setRole(roleuser);

				if (profile != null && !profile.isEmpty()) {
					try {
						user.setProfile(profile.getBytes());

					} catch (IOException e) {
						e.printStackTrace();
						logger.error("", e);
						return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
								.body("{\"message\": \"Error compressing image\"}");
					}
				}
				muserrepositories.save(user);
				List<String> bcc = null;
				List<String> cc = null;
				String institutionname = existingInstitute;
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
				String body = String.format("<html>" + "<body>" + "<h2>Welcome to LearnHub!</h2>" + "<p>Dear %s,</p>"
						+ "<p>We are excited to have you on board at LearnHub, your gateway to knowledge and growth.</p>"
						+ "<p>Here are your login credentials to access your courses:</p>" + "<ul>"
						+ "<li><strong>Username (Email):</strong> %s</li>" + "<li><strong>Password:</strong> %s</li>"
						+ "</ul>"
						+ "<p>Start exploring your enrolled courses, engage with trainers, and enhance your learning experience.</p>"
						+ "<p>If you need any support, feel free to reach out to our help desk.</p>"
						+ "<p>Click the link below to sign in:</p>" + "<p><a href='" + signInLink
						+ "' style='font-size:16px; color:blue;'>Sign In</a></p>" + "<p>Happy Learning!</p>"
						+ "<p>Best Regards,<br>LearnHub Team</p>" + "</body>" + "</html>", username, // Student Name
						email, // Student Username (email)
						plainTextPassword // Student Password (plain text)
				);

				if (institutionname != null && !institutionname.isEmpty()) {
					try {
						List<String> emailList = new ArrayList<>();
						emailList.add(email);
						emailservice.sendHtmlEmailAsync(institutionname, emailList, cc, bcc,
								"Welcome to LearnHub - Start Your Learning Journey!", body);
					} catch (Exception e) {
						logger.error("Error sending mail: " + e.getMessage());
					}
				}
				System.out.println("hii");

				return ResponseEntity.ok().body("{\"message\": \"saved Successfully\"}");
			} else {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
						.body("{\"message\": \"Error getting role\"}");

			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("{\"message\": \"Internal Server Error\"}");
		}
	}

	public ResponseEntity<?> RegisterTrainer(HttpServletRequest request, String username, String psw, String email,
			LocalDate dob, String role, String phone, String skills, MultipartFile profile, Boolean isActive,
			String countryCode, String otp) {
		try {
			if (!otpService.validateOtp(email, otp)) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
			}
			// Remove OTP after successful verification
			otpService.clearOtp(email);
			if (!environment.equals("VPS")) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST)
						.body("Cannot Register as Trainer in Sas Environment");
			}
			MuserAddInfoDto adminInfo = muserrepositories.getAdminInfo(email);
			System.out.println(adminInfo.toString());
			if (adminInfo.getAdminCount() == 0) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No Institution Found");
			}
			if (adminInfo.getAdminCount() > 1) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST)
						.body("Cannot Register as Trainer in Sas Environment");
			}
			if (adminInfo.getInstitutionName() == null || adminInfo.getInstitutionName().isEmpty()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Institution not Found");
			}
			if (adminInfo.isEmailExists()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("EMAIL");
			}

			String adminEmail = adminInfo.getAdminEmail();
			String existingInstitute = adminInfo.getInstitutionName();

			Optional<MuserRoles> oproleUser = muserrolerepository.findByRoleName("TRAINER");
			if (oproleUser.isPresent()) {
				MuserRoles roleuser = oproleUser.get();

				if (username == null || username.trim().isEmpty()) {
					// Extract the part before '@' from the email
					if (email != null && email.contains("@")) {
						username = email.substring(0, email.indexOf("@"));
					}
				}

				// Save trainer approval request
				MuserApprovals user = new MuserApprovals();
				user.setUsername(username);
				user.setEmail(email);
				user.setIsActive(isActive);
				user.setPsw(psw);
				user.setPhone(phone);
				user.setDob(dob);
				user.setSkills(skills);
				user.setInstitutionName(existingInstitute);
				user.setCountryCode(countryCode);
				user.setRole(roleuser);

				if (profile != null && !profile.isEmpty()) {
					try {
						user.setProfile(profile.getBytes());
					} catch (IOException e) {
						logger.error("Error processing profile image", e);
					}
				}
				MuserApproval.save(user);
				// Send Approval Email to Admin
				sendApprovalEmail(request, adminEmail, user);

				return ResponseEntity.ok().body("{\"message\": \"Trainer registration pending approval.\"}");
			} else {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("{\"message\": \"Error getting role\"}");
			}

		} catch (Exception e) {
			logger.error("Error registering trainer", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("{\"message\": \"Internal Server Error\"}");
		}
	}

	private void sendApprovalEmail(HttpServletRequest request, String adminEmail, MuserApprovals trainer) {
		try {
			// Extract domain dynamically
			String domain = request.getHeader("origin");
			if (domain == null || domain.isEmpty()) {
				domain = request.getScheme() + "://" + request.getServerName();
				if (request.getServerPort() != 80 && request.getServerPort() != 443) {
					domain += ":" + request.getServerPort();
				}
			}

			// Construct the Approvals Page Link
			String approvalLink = domain + "/view/Approvals";

			StringBuilder body = new StringBuilder();
			body.append("<html><body>");
			body.append("<h2>Trainer Approval Request</h2>");
			body.append("<p>Dear Admin,</p>");
			body.append("<p>A new trainer has registered and is awaiting your approval.</p>");
			body.append("<p><strong>Trainer Details:</strong></p>");
			body.append("<ul>");
			body.append("<li><strong>Name:</strong> ").append(trainer.getUsername()).append("</li>");
			body.append("<li><strong>Email:</strong> ").append(trainer.getEmail()).append("</li>");
			body.append("<li><strong>Phone:</strong> ").append(trainer.getPhone()).append("</li>");
			body.append("<li><strong>Skills:</strong> ")
					.append(trainer.getSkills() != null ? trainer.getSkills() : "Not specified").append("</li>");
			body.append("<li><strong>Date of Birth:</strong> ")
					.append(trainer.getDob() != null ? trainer.getDob().toString() : "Not specified").append("</li>");
			body.append("<li><strong>Institution:</strong> ").append(trainer.getInstitutionName()).append("</li>");
			body.append("</ul>");
			body.append("<p><a href='").append(approvalLink)
					.append("' style='font-size:16px; color:blue;'>Review Approvals</a></p>");
			body.append("<p>Best Regards,<br>LearnHub Team</p>");
			body.append("</body></html>");

			List<String> addminEmailList = new ArrayList<String>();
			addminEmailList.add(adminEmail);
			emailservice.sendHtmlEmailAsync(trainer.getInstitutionName(), addminEmailList, null, null,
					"Trainer Approval Required - LearnHub", body.toString());

			logger.info("Trainer approval email sent to Admin: " + adminEmail);
		} catch (Exception e) {
			logger.error("Error sending trainer approval email: " + e.getMessage());
		}
	}

	public ResponseEntity<?> getUserByEmail(String email, String token) {
		try {
			String emailofreq = jwtUtil.getEmailFromToken(token);
			String institution = "";
			Optional<Muser> opuser = muserrepositories.findByEmail(emailofreq);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				institution = user.getInstitutionName();
				boolean adminIsactive = muserrepositories.getactiveResultByInstitutionName("ADMIN", institution);
				if (!adminIsactive) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			Optional<MuserRequiredDto> userOptional = muserrepositories.findDetailandProfileByEmailAndInstitution(email,
					institution);

			// If the user is found, process the user data
			if (userOptional.isPresent()) {
				MuserRequiredDto user = userOptional.get();

				return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(user);
			} else {
				// If the user is not found, return a 404 not found response
				return ResponseEntity.notFound().build();
			}
		} catch (Exception e) {
			// Log the exception for debugging and auditing purposes
			e.printStackTrace(); // Consider using a proper logging framework in production code
			logger.error("", e);
			// Return a 500 internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).contentType(MediaType.APPLICATION_JSON)
					.body(null);
		}
	}

	public ResponseEntity<?> getTrainerDetailsByEmail(String email, String token) {
		try {
			String emailofreq = jwtUtil.getEmailFromToken(token);
			String role = jwtUtil.getRoleFromToken(token);
			String institution = "";
			Optional<Muser> opuser = muserrepositories.findByEmail(emailofreq);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				institution = user.getInstitutionName();
				boolean adminIsactive = muserrepositories.getactiveResultByInstitutionName("ADMIN", institution);
				if (!adminIsactive) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			// Perform authentication based on role
			if ("ADMIN".equals(role)) {
				Optional<MuserProfileDTO> userOptional = muserrepositories
						.findProfileAndCountryCodeAndRoleByEmailAndInstitutionName(email, institution);
				if (userOptional.isPresent()) {
					MuserProfileDTO user = userOptional.get();
					return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(user);
				} else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Trainer not found\"}");
				}
			} else {
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

	public ResponseEntity<?> getStudentDetailsByEmail(String email, String token) {

		try {
			String role = jwtUtil.getRoleFromToken(token);
			String emailofreq = jwtUtil.getEmailFromToken(token);

			String institution = "";
			Optional<Muser> opuser = muserrepositories.findByEmail(emailofreq);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				institution = user.getInstitutionName();
				boolean adminIsactive = muserrepositories.getactiveResultByInstitutionName("ADMIN", institution);
				if (!adminIsactive) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			// Perform authentication based on role
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Optional<MuserProfileDTO> userOptional = muserrepositories
						.findProfileAndCountryCodeAndRoleByEmailAndInstitutionName(email, institution);
				if (userOptional.isPresent()) {
					MuserProfileDTO user = userOptional.get();
					return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(user);
				} else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Student not found\"}");
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getDetailsbyemail(String email, String token) {
		try {
			String emailofreq = jwtUtil.getEmailFromToken(token);

			String institution = "";
			Optional<Muser> opuser = muserrepositories.findByEmail(emailofreq);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				if ("SYSADMIN".equals(user.getRole().getRoleName())) {
					Optional<MuserDto> opadmin = muserrepositories.findDetailsByEmailforSysadmin(email);
					if (opadmin.isPresent()) {
						MuserDto admin = opadmin.get();
						return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(admin);
					} else {
						return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"User not found\"}");
					}
				}
				institution = user.getInstitutionName();
				Optional<MuserDto> opdto = muserrepositories.findDetailsByEmailAndInstitution(email, institution);
				if (opdto.isPresent()) {
					MuserDto usertosend = opdto.get();
					return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(usertosend);
				} else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"User not found\"}");
				}

			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}

	public ResponseEntity<?> getAdminDetailsBYEmail(String email, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> opuser = muserrepositories.findByEmail(email);
				if (opuser.isPresent()) {
					Muser user = opuser.get();

					Optional<MuserProfileDTO> userOptional = muserrepositories
							.findProfileAndCountryCodeAndRoleByEmail(email);
					if (userOptional.isPresent()) {

						MuserProfileDTO userdto = userOptional.get();
						userdto.setLastactive(
								muserrepositories.findLatestLastActiveByInstitution(user.getInstitutionName()));
						return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(userdto);
					} else {
						return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Admin not found\"}");
					}
				} else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"Admin not found\"}");
				}
			} else {
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

	public ResponseEntity<?> sendOTP(String email) {
		try {
			Optional<Muser> existingUser = muserrepositories.findByEmail(email);
			if (existingUser.isPresent()) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("EMAIL");
			}

			// Generate and store OTP
			String otp = otpService.generateOtpAndStore(email);

			// Prepare the email
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(otpService.getEmailUsername()); // safer than using injected emailUsername directly
			message.setTo(email);
			message.setSubject("LearnHub - Email Verification OTP");

			String emailContent = String.format("Dear User,\n\n"
					+ "Welcome to LearnHub! We're excited to have you join our learning community.\n\n"
					+ "To complete your registration and verify your email address, please use the following One-Time Password (OTP):\n\n"
					+ "                          %s\n\n" + "Important Notes:\n"
					+ "• This OTP is valid for 5 minutes only\n" + "• Please do not share this OTP with anyone\n"
					+ "• If you didn't request this OTP, please ignore this email\n\n"
					+ "Need help? Contact our support team at support@meganartech.com\n\n" + "Best regards,\n"
					+ "The LearnHub Team\n\n"
					+ "Note: This is an auto-generated email. Please do not reply to this email.", otp);

			message.setText(emailContent);
			mailSender.send(message);

			return ResponseEntity.ok().body("OTP sent successfully");
		} catch (Exception e) {
			logger.error("Error sending OTP", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send OTP");
		}
	}

	public ResponseEntity<?> verifyOTP(String email, String otp) {
		boolean isValid = otpService.validateOtp(email, otp);
		if (!isValid) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
		}

		return ResponseEntity.ok().body("OTP verified successfully");
	}

}
