package com.knowledgeVista.Course.certificate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.Course.Test.MuserTestActivity;
import com.knowledgeVista.Course.Test.Repository.MusertestactivityRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
@RestController
public class certificateController {
	@Autowired
	private certificateRepo certificaterepo;
	 @Autowired
	 private JwtUtil jwtUtil;
		@Autowired
		private MuserRepositories muserRepository;
		
		@Autowired
		private MusertestactivityRepo activityrepo;
		
		 private static final Logger logger = LoggerFactory.getLogger(certificateController.class);

	
	
	public ResponseEntity<?> addcertificate(  String institutionName, String ownerName, String qualification, String address,
	         MultipartFile authorizedSign, String token) {
		// @RequestParam("certificateTemplate") MultipartFile certificateTemplate
	    try {
	         String role = jwtUtil.getRoleFromToken(token);
	         String email=jwtUtil.getEmailFromToken(token); 
	         String userinstitution="";
		     Optional<Muser> opuser =muserRepository.findByEmail(email);
		     if(opuser.isPresent()) {
		    	 Muser user=opuser.get();
		    	 userinstitution=user.getInstitutionName();
		    	 boolean adminIsactive=muserRepository.getactiveResultByInstitutionName("ADMIN", userinstitution);
		   	    	if(!adminIsactive) {
		   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		   	    	}
		     }else {
	             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		     }
	         if("ADMIN".equals(role)) {
	        	 Optional<certificate> opcertificate=certificaterepo.findByInstitution(userinstitution);
	         if(opcertificate.isPresent()) {
	        	 return  ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Certificate already exists");
	        
	         }else {
	        	  // Compress the authorized sign image
	 	        byte[] compressedAuthorizedSign = authorizedSign.getBytes();
	 	        // Create a new Certificate object with the extracted data
	 	        certificate certificate = new certificate();
	 	        certificate.setInstitutionName(institutionName);
	 	        certificate.setOwnerName(ownerName);
	 	        certificate.setQualification(qualification);
	 	        certificate.setAddress(address);
	 	        certificate.setInstitution(userinstitution);
	 	        certificate.setAuthorizedSign(compressedAuthorizedSign);
	 	        
	 	        certificaterepo.save(certificate);
	            return ResponseEntity.ok("Certificate Saved successfully.");
	 	        }
	         }else {
		            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
		                    .body("Unauthorized access");
	         }
	        
	    } catch (Exception e) {
		    e.printStackTrace();
		    logger.error("", e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("An error occurred while updating the certificate: " + e.getMessage() );
	    }
	}
	
//================================Edit Mapping=================================

	public ResponseEntity<String> editcertificate( String institutionName, String ownerName, String qualification, String address,
			MultipartFile authorizedSign,Long certificateId, String token
	) {
	    try {
	        // Get the role from the token
	        String role = jwtUtil.getRoleFromToken(token);
	        String email=jwtUtil.getEmailFromToken(token);
	      
	         String institution="";
		     Optional<Muser> opuser =muserRepository.findByEmail(email);
		     if(opuser.isPresent()) {
		    	 Muser user=opuser.get();
		    	 institution=user.getInstitutionName();
		    	 boolean adminIsactive=muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
		   	    	if(!adminIsactive) {
		   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		   	    	}
		     }else {
	             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		     }
	        // Check if the user is an admin
	        if (!"Admin".equalsIgnoreCase(role)) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                    .body("Unauthorized access");
	        }

	        // Find the certificate by ID
	        Optional<certificate> optionalCertificate = certificaterepo.findByIdAndInstitution(certificateId, institution);
	       System.out.println(certificateId);
	       System.out.println(institutionName);
	        if (optionalCertificate.isPresent()) {
	            certificate certificate = optionalCertificate.get();
                if(authorizedSign!=null) {
	            // Compress the authorized sign image
	            byte[] compressedAuthorizedSign = authorizedSign.getBytes();
	            System.out.println("found image");
	            certificate.setAuthorizedSign(compressedAuthorizedSign);
                }
	            // Update the certificate details
                
	            certificate.setInstitutionName(institutionName);
	            certificate.setOwnerName(ownerName);
	            certificate.setQualification(qualification);
	            certificate.setAddress(address);

	            // Save the updated certificate to the database
	            certificaterepo.saveAndFlush(certificate);

	            // Return a JSON response with a success message
	            return ResponseEntity.ok("Certificate updated successfully.");
	        } else {
	            // Certificate not found
	            return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                    .body("Certificate not found.");
	        }
	    } catch (Exception e) {
	        // Handle internal server error and return a JSON response
		    e.printStackTrace();
		    logger.error("", e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("An error occurred while updating the certificate: " + e.getMessage() );
	    }
	}
	
	
	
//````````````````````````````WORING````````````````````````````````````````````````````````)
	public ResponseEntity<?> viewCoursecertificate(String token) {
		 try {
		        jwtUtil.getRoleFromToken(token);
		        String email=jwtUtil.getEmailFromToken(token);
		         String institution="";
			     Optional<Muser> opuser =muserRepository.findByEmail(email);
			     if(opuser.isPresent()) {
			    	 Muser user=opuser.get();
			    	 institution=user.getInstitutionName();
			    	 boolean adminIsactive=muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
			   	    	if(!adminIsactive) {
			   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			   	    	}
			     }else {
		             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			     }
	    Optional<certificate> opcertificate = certificaterepo.findByInstitution(institution);
	    
	    if (opcertificate.isPresent()) {
	    	 certificate certi = opcertificate.get();
	            byte[] sign = certi.getAuthorizedSign();
	            certi.setAuthorizedSign(sign);
	            return ResponseEntity.ok()
	                .contentType(MediaType.APPLICATION_JSON)
	                .body(certi);
	       
	    } else {
	    	 return ResponseEntity.status(HttpStatus.NO_CONTENT)
	 	            .body("No certificates found");
	           
	        }
	    
	    
		 } catch (Exception e) {
		        // Handle internal server error and return a JSON response
			 e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }
	}
	
	
//-------------------Table view of certificates in user---------------------------------

	public ResponseEntity<?> sendAllCertificate( String token) {
		 try {
	
	    String username = jwtUtil.getEmailFromToken(token);
	    Optional<Muser> opuser = muserRepository.findByEmail(username);
	    if (opuser.isPresent()) {
	        Muser user = opuser.get();
	        List<MuserTestActivity> activityDetails = activityrepo.findByuser(user);

	        // Group activityDetails by courseId
	        Map<Long, List<MuserTestActivity>> activityByCourseId = activityDetails.stream()
	                .collect(Collectors.groupingBy(activity -> activity.getCourse().getCourseId()));

	        List<HashMap<String, Object>> allActivityHashMaps = new ArrayList<>();
	        for (List<MuserTestActivity> activityList : activityByCourseId.values()) {
	            for (MuserTestActivity act : activityList) {
	                // Check if the activity percentage is greater than or equal to pass percentage
	                if (act.getPercentage() >= act.getTest().getPassPercentage()) {
	                    HashMap<String, Object> hashMap = new HashMap<>();
	                    hashMap.put("activityId", act.getActivityId());
	                    hashMap.put("user", act.getUser().getUsername());
	                    hashMap.put("course", act.getCourse().getCourseName());
	                    hashMap.put("testDate", act.getTestDate());
	                    hashMap.put("percentage", act.getPercentage());
	                    allActivityHashMaps.add(hashMap); // Add each HashMap to the list
	                    break; // No need to check further activities for this course
	                }
	            }
	        }

	        // Return the list of HashMaps as the response body
	        return ResponseEntity.ok().body(allActivityHashMaps);
	    }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("");
		 } catch (Exception e) {
		        // Handle internal server error and return a JSON response
			 e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage());
		    }
	}

	
public ResponseEntity<?> getByActivityId( Long activityId, String token) {
	 try {
        Optional<MuserTestActivity> opActivity = activityrepo.findById(activityId);
        if (opActivity.isPresent()) {
            MuserTestActivity activity = opActivity.get();
            HashMap<String, Object> hashMap = new HashMap<>();
            hashMap.put("user", activity.getUser().getUsername());
            hashMap.put("course", activity.getCourse().getCourseName());
            hashMap.put("testDate", activity.getTestDate());
            hashMap.put("percentage", activity.getPercentage());
            
            return ResponseEntity.ok().body(hashMap);
        } else {
            // Activity not found
		
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Activity not found");
        }
    
	 } catch (Exception e) {
	        // Handle internal server error and return a JSON response
		 e.printStackTrace();    logger.error("", e);;
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("An error occurred while updating the certificate: " + e.getMessage() );
	    }
}

}
	
