package com.knowledgeVista.Course.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.Repository.videoLessonRepo;
import com.knowledgeVista.License.licenseRepository;
import com.knowledgeVista.Payments.Orderuser;
import com.knowledgeVista.Payments.repos.OrderuserRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.UserStats;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@RestController
public class CourseControllerSecond {
	
	 @Autowired
	 private JwtUtil jwtUtil;
	@Autowired
	private MuserRepositories muserRepository;	
 	@Autowired
	private videoLessonRepo lessonrepo;
	@Autowired
	private licenseRepository licencerepo;
	@Autowired
	private OrderuserRepo orderrepo;
	
	private static final Logger logger = LoggerFactory.getLogger(CourseControllerSecond.class);
	
	public ResponseEntity<?> getstoragedetails(String token) {
	    try {
	        String role = jwtUtil.getRoleFromToken(token);
	        if (!"ADMIN".equals(role)) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        }
	        String email = jwtUtil.getEmailFromToken(token);
	        Optional<Muser> opuser = muserRepository.findByEmail(email);

	        if (opuser.isPresent()) {
	            Muser user = opuser.get();
	            String institution = user.getInstitutionName();
	            Long totalStorageUsed = lessonrepo.findTotalSizeByInstitution(institution);
	            System.out.println("total used: " + totalStorageUsed);
	            Long maxStorageLimitBytes = licencerepo.FindstoragesizeByinstitution(institution) * (1024L * 1024 * 1024);

	            // Calculate in bytes first
	            Long balanceStorageBytes = maxStorageLimitBytes - (totalStorageUsed != null ? totalStorageUsed : 0);

	            // Convert values
	            long maxStorageLimitGB = maxStorageLimitBytes / (1024 * 1024 * 1024);
	            long totalStorageUsedGB = (totalStorageUsed != null ? totalStorageUsed : 0) / (1024 * 1024 * 1024);
	            long balanceStorageGB = balanceStorageBytes / (1024 * 1024 * 1024);

	            Map<String, Object> response = new HashMap<>();

	            // Total storage
	            if (maxStorageLimitGB >= 1) {
	                response.put("total", String.format("%d GB", maxStorageLimitGB));
	            } else if (maxStorageLimitBytes / (1024 * 1024) >= 1) {
	                response.put("total", String.format("%d MB", maxStorageLimitBytes / (1024 * 1024)));
	            } else {
	                response.put("total", String.format("%d KB", maxStorageLimitBytes / 1024));
	            }

	            // Used storage
	            if (totalStorageUsedGB >= 1) {
	                response.put("StorageUsed", String.format("%d GB", totalStorageUsedGB));
	            } else if ((totalStorageUsed != null ? totalStorageUsed : 0) / (1024 * 1024) >= 1) {
	                response.put("StorageUsed", String.format("%d MB", (totalStorageUsed != null ? totalStorageUsed : 0) / (1024 * 1024)));
	            } else {
	                response.put("StorageUsed", String.format("%d KB", (totalStorageUsed != null ? totalStorageUsed : 0) / 1024));
	            }

	            // Balance storage
	            if (balanceStorageGB >= 1) {
	                response.put("balanceStorage", String.format("%d GB", balanceStorageGB));
	            } else if (balanceStorageBytes / (1024 * 1024) >= 1) {
	                response.put("balanceStorage", String.format("%d MB", balanceStorageBytes / (1024 * 1024)));
	            } else {
	                response.put("balanceStorage", String.format("%d KB", balanceStorageBytes / 1024));
	            }

	            System.out.println("Storage details: " + response);
	            return ResponseEntity.ok(response);

	        } else {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        }
	    } catch (Exception e) {
	        e.printStackTrace();
	        logger.error("", e); // Replace with a logging framework
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    }
	}
	public double calculateRemainingAmount(Long userId) {
	    // Fetch user by ID
	    Muser user = muserRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

	    double totalRemainingAmount = 0.0;
	    for (CourseDetail course : user.getCourses()) {
	        List<Orderuser> payments = orderrepo.findByUserIdAndCourseIdAndAmountReceivedGreaterThanzero(user.getUserId(), course.getCourseId());

	        int totalReceived = payments.stream()
	                                    .mapToInt(Orderuser::getAmountReceived)
	                                    .sum();
	        double remainingAmount = Math.max(0, course.getAmount() - totalReceived);  // Ensure no negative amounts

	        totalRemainingAmount += remainingAmount;

	    }

	    return totalRemainingAmount;
	}
	public ResponseEntity<?>getAllStudentCourseDetails( String token){
		  try {
		         String role = jwtUtil.getRoleFromToken(token);
		         if(!"ADMIN".equals(role)) {
		        	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); 
		         }
		         String email=jwtUtil.getEmailFromToken(token);
		         Optional<Muser> opuser =muserRepository.findByEmail(email);
			     if(opuser.isPresent()) {
			    	 Muser user=opuser.get();
			    	String institution=user.getInstitutionName();
			    	List<UserStats> studentstats=muserRepository.findStudentStatsByInstitutionName(institution);
			    	for(UserStats student :studentstats) {
			    		student.setPending(this.calculateRemainingAmount(student.getUserId()));
			    	}
			    	return ResponseEntity.ok(studentstats);
			    	
			      }else {
		             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			     }
		  } catch (Exception e) {
		         e.printStackTrace();logger.error("", e); // You can replace this with logging framework like Log4j
		         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		     }
		 }
	 
	public ResponseEntity<?>getAllTrainerhandlingUsersAndCourses( String token){
		  try {
		         String role = jwtUtil.getRoleFromToken(token);
		         if(!"ADMIN".equals(role)) {
		        	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); 
		         }
		         String email=jwtUtil.getEmailFromToken(token);
		         Optional<Muser> opuser =muserRepository.findByEmail(email);
			     if(opuser.isPresent()) {
			    	 Muser user=opuser.get();
			    	String institution=user.getInstitutionName();
			    	List<UserStats> trainerstats=muserRepository.findTrainerStatsByInstitutionName(institution);
			    	return ResponseEntity.ok(trainerstats);
			    	
			      }else {
		             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			     }
		  } catch (Exception e) {
		         e.printStackTrace();logger.error("", e); // You can replace this with logging framework like Log4j
		         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		     }
		 }
	

	 
	 
	


}
