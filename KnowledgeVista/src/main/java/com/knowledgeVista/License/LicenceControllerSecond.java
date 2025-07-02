package com.knowledgeVista.License;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@RestController
public class LicenceControllerSecond {
	 @Autowired
	 private JwtUtil jwtUtil;

	 @Autowired
	 private MuserRepositories muserrepo;
	 @Autowired
	    private licenseRepository licenseRepository;
	 
	 @Autowired
		private mAdminLicenceRepo madminrepo;

	    @Value("${upload.licence.directory}")
	    private String licenceUploadDirectory;
	    
	
	    
	    @Value("${upload.licence.directory}")
	    private String olddir;
	 
	    //for sas------------------
	    @Value("${upload.free.licence.directory}")
	    private String freelicencedir;
	    
	    @Value("${upload.standard.licence.directory}")
	    private String standardlicencedir;
	    
	   	 private static final Logger logger = LoggerFactory.getLogger(LicenceControllerSecond.class);

	    public ResponseEntity<?>GetLicenseDetails(String token){
	    	try {
	    		String uemail = jwtUtil.getEmailFromToken(token);
	            Optional<Muser> opuser= muserrepo.findByEmail(uemail);
	            if(opuser.isPresent()) {

	         	   Muser user= opuser.get();
	         	   String institution=user.getInstitutionName();
	         	   madminrepo.findByInstitutionName(institution);
	         	  Optional<License> oplicence=licenseRepository.findByinstitution(institution);
	         	    if(oplicence.isPresent()) {
	         	    	License licence=oplicence.get();
	         	    	return ResponseEntity.ok(licence);
	         	   }else {
	         		   return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	         	   }
	            }else {
	            	return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	            }

	    	}catch(Exception e) {
	    		e.printStackTrace();    logger.error("", e);;
	    		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    	}
	    }

	    public ResponseEntity<?>GetLicenseDetailsofadmin(String token,String adminemail){
	    	try {
	    		String role = jwtUtil.getRoleFromToken(token);
	    		if("SYSADMIN".equals(role)) {
	            Optional<Muser> opuser= muserrepo.findByEmail(adminemail);
	            if(opuser.isPresent()) {

	         	   Muser user= opuser.get();
	         	   String institution=user.getInstitutionName();
	         	   madminrepo.findByInstitutionName(institution);
	         	  Optional<License> oplicence=licenseRepository.findByinstitution(institution);
	         	    if(oplicence.isPresent()) {
	         	    	License licence=oplicence.get();
	         	    	return ResponseEntity.ok(licence);
	         	   }else {
	         		   return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Licence Not Found");
	         	   }
	            }else {
	            	 return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Admin Not FOund");
	            }
	    		}else {
	    			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	    		}
	    	}catch(Exception e) {
	    		e.printStackTrace();    logger.error("", e);;
	    		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	    	}
	    }


}
