package com.knowledgeVista.secretapis;

import java.time.LocalDate;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.knowledgeVista.Course.Test.Repository.MusertestactivityRepo;
import com.knowledgeVista.License.LicenseController;
import com.knowledgeVista.License.Madmin_Licence;
import com.knowledgeVista.License.mAdminLicenceRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@RestController
@RequestMapping("/secret")
@CrossOrigin
public class DeleteApis {
	@Autowired
	private MuserRepositories muserrepositories;

	@Autowired
	private MusertestactivityRepo activityrepo;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private mAdminLicenceRepo madminrepo;
	@Autowired
	private LicenseController licenseController;

	@Value("${spring.environment}")
	private String environment;

	private static final Logger logger = LoggerFactory.getLogger(DeleteApis.class);

	@DeleteMapping("/Delete/Trainer/{email}")
	public ResponseEntity<?> deleteTrainer(@RequestHeader("Authorization") String token, @PathVariable String email) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("TRAINER".equals(user.getRole().getRoleName())) {
						// Clear user's courses and delete the user
						user.getAllotedCourses().clear();
						user.getCourses().clear();
						muserrepositories.delete(user);
						return ResponseEntity.ok().body("{\"message\": \"Deleted Successfully\"}");
					}
					return ResponseEntity.notFound().build();
				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {
				// Return not found if the user with the given email does not exist
				return ResponseEntity.notFound().build();
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

	@DeleteMapping("/Delete/User/{email}")
	public ResponseEntity<?> deleteStudent(@RequestHeader("Authorization") String token, @PathVariable String email) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("USER".equals(user.getRole().getRoleName())) {
						// Clear user's courses and delete the user
						user.getCourses().clear();
						activityrepo.deleteByUser(user);
						muserrepositories.delete(user);
						return ResponseEntity.ok().body("{\"message\": \"Deleted Successfully\"}");
					}

					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();

				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {
				// Return not found if the user with the given email does not exist
				return ResponseEntity.notFound().build();
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

	@DeleteMapping("/Delete/Admin/{email}")
	public ResponseEntity<?> deleteAdmin(@RequestHeader("Authorization") String token, @PathVariable String email) {
		try {
			String role = jwtUtil.getRoleFromToken(token);

			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("ADMIN".equals(user.getRole().getRoleName())) {
						// Clear user's courses and delete the user
						user.getCourses().clear();
						activityrepo.deleteByUser(user);
						muserrepositories.delete(user);
						return ResponseEntity.ok().body("{\"message\": \"Deleted Successfully\"}");
					}

					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();

				} else {
					// Return not found if the user with the given email does not exist
					return ResponseEntity.notFound().build();
				}
			} else {
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

	@PostMapping("/EditLicence/{email}/{type}")
	public ResponseEntity<?> EditLicence(@RequestHeader("Authorization") String token, @PathVariable String email,
			@PathVariable String type) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			// Perform authentication based on role
			if ("SYSADMIN".equals(role)) {
				Optional<Muser> existingUser = muserrepositories.findByEmail(email);
				if (existingUser.isPresent()) {
					Muser user = existingUser.get();
					if ("ADMIN".equals(user.getRole().getRoleName())) {

						if (environment.equals("SAS"))

						{
							Madmin_Licence madmin = madminrepo.findByInstitutionName(user.getInstitutionName());
							if (madmin == null) {
								madmin = new Madmin_Licence();
							}
							madmin.setInstitution(user.getInstitutionName());
							madmin.setAdminId(user.getUserId());
							madmin.setLicenceType(type);
							madmin.setUpdatedDate(LocalDate.now());
							madminrepo.save(madmin);
							return licenseController.uploadSAS(madmin, user);

						} else {
							return ResponseEntity.status(HttpStatus.BAD_REQUEST)
									.body("This operation is not allowed in vps");
						}
					} else {
						return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("given email is not Admins email");
					}
				} else {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("user not present");
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("unauthrized operation");
			}

		} catch (

		Exception e) {
			// TODO: handle exception
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

}