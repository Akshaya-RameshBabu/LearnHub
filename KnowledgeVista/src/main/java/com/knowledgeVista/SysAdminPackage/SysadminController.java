package com.knowledgeVista.SysAdminPackage;

import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.License.LicenseController;
import com.knowledgeVista.Meeting.ZoomAccountKeys;
import com.knowledgeVista.Meeting.ZoomMeetAccountController;
import com.knowledgeVista.SocialLogin.SocialLoginKeys;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.MuserDto;
import com.knowledgeVista.User.Controller.GoogleAuthController;
import com.knowledgeVista.User.Controller.MserRegistrationController;
import com.knowledgeVista.User.Repository.MuserRepoPageable;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.CacheService;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@RestController
@CrossOrigin
public class SysadminController {
	@Autowired
	private MuserRepositories muserrepositories;
	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	private MuserRepoPageable muserPageRepo;

	private static final Logger logger = LoggerFactory.getLogger(SysadminController.class);

	@Value("${spring.environment}")
	private String environment;

	@Autowired
	private LicenseController licence;

	@Autowired
	private ZoomMeetAccountController zoomaccountconfig;

	@Autowired
	private GoogleAuthController googleauth;
	@Autowired
	private MserRegistrationController muserreg;
	@Autowired
	private CacheService cacheService;

	@GetMapping("/ViewAll/Admins")
	public ResponseEntity<?> ViewAllAdmins(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if (role.equals("SYSADMIN")) {
				Pageable pageable = PageRequest.of(pageNumber, pageSize);
				Page<MuserDto> admins = muserPageRepo.findByRoleName("ADMIN", pageable);
				admins.forEach(admin -> {
					// Find the latest last active for the admin's institution
					String institutionName = admin.getInstitutionName();
					LocalDateTime latestLastActive = muserrepositories
							.findLatestLastActiveByInstitution(institutionName);

					// Set the last active field in the admin DTO
					admin.setLastActive(latestLastActive);
				});
				return ResponseEntity.ok(admins);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	@GetMapping("/ViewAll/Trainers")
	public ResponseEntity<?> ViewAllTrainers(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if (role.equals("SYSADMIN")) {
				Pageable pageable = PageRequest.of(pageNumber, pageSize);
				Page<MuserDto> trainers = muserPageRepo.findByRoleName("TRAINER", pageable);

				return ResponseEntity.ok(trainers);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	@GetMapping("/ViewAll/Students")
	public ResponseEntity<?> ViewAllStudents(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if (role.equals("SYSADMIN")) {
				Pageable pageable = PageRequest.of(pageNumber, pageSize);
				Page<MuserDto> students = muserPageRepo.findByRoleName("USER", pageable);

				return ResponseEntity.ok(students);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	@DeleteMapping("/deactivate/admin")
	public ResponseEntity<?> DeActiveteAdmin(@RequestParam("email") String email, @RequestParam("reason") String reason,
			@RequestHeader("Authorization") String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("ADMIN".equals(user.getRole().getRoleName())) {
						user.setIsActive(false);
						user.setInactiveDescription(reason);
						muserrepositories.save(user);
						cacheService.updateAdminStatus(user.getInstitutionName());
						cacheService.updateUserActiveStatus(email);
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
			e.printStackTrace();
			logger.error("", e);
			; // You can replace this with logging framework like Log4j
				// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@DeleteMapping("/activate/admin")
	public ResponseEntity<?> ActiveteAdmin(@RequestParam("email") String email,
			@RequestHeader("Authorization") String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("ADMIN".equals(user.getRole().getRoleName())) {
						user.setIsActive(true);
						user.setLoginAttempts(0);
						user.setInactiveDescription("");
						muserrepositories.save(user);
						cacheService.updateAdminStatus(user.getInstitutionName());
						cacheService.updateUserActiveStatus(email);
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
			e.printStackTrace();
			logger.error("", e);
			; // You can replace this with logging framework like Log4j
				// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@PostMapping("/api/Sysadmin/uploadLicence")
	public ResponseEntity<?> uploadLicence(@RequestParam("audioFile") MultipartFile File,
			@RequestHeader("Authorization") String token) {
		if (environment.equals("SAS")) {
			return licence.uploadBysysAdmin(File, token);
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Licence Cannot Be uploaded By SysAdmin");

		}
	}

	@PostMapping("/SysAdmin/zoom/save/Accountdetails")
	public ResponseEntity<?> SaveAccountDetailsSYS(@RequestBody ZoomAccountKeys accountdetails,
			@RequestHeader("Authorization") String token) {
		return zoomaccountconfig.SaveAccountDetailsSYS(accountdetails, token);
	}

	@PatchMapping("/SysAdmin/zoom/Edit/Accountdetails")
	public ResponseEntity<?> EditAccountDetailsSYS(@RequestBody ZoomAccountKeys accountdetails,
			@RequestHeader("Authorization") String token) {
		return zoomaccountconfig.EditAccountDetailsSYS(accountdetails, token);
	}

	@GetMapping("/SysAdmin/zoom/get/Accountdetails")
	public ResponseEntity<?> getMethodNameSYS(@RequestHeader("Authorization") String token) {
		return zoomaccountconfig.getMethodNameSYS(token);
	}

	@GetMapping("/sysadmin/get/socialLoginKeys")
	public ResponseEntity<?> getSocialLoginKeys(@RequestParam String Provider,
			@RequestHeader("Authorization") String token) {
		return googleauth.getSocialLoginKeys(Provider, token);
	}

	@PostMapping("/sysadmin/save/SocialKeys")
	public ResponseEntity<?> postMethodName(@RequestBody SocialLoginKeys loginkeys,
			@RequestHeader("Authorization") String token) {
		return googleauth.saveOrUpdateSocialLoginKeys(loginkeys, token);
	}

	@GetMapping("/student/getadmin/{email}")
	public ResponseEntity<?> getAdminDetailsBYEmail(@PathVariable String email,
			@RequestHeader("Authorization") String token) {
		return muserreg.getAdminDetailsBYEmail(email, token);
	}
}
