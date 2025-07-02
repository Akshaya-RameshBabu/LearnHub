package com.knowledgeVista.Meeting;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;


@RestController
@CrossOrigin
public class ZoomMeetAccountController {
	@Autowired
	private ZoomAccountkeyrepo zoomacrepo;
	 @Autowired
	 private JwtUtil jwtUtil;
	 @Autowired
		private MuserRepositories muserRepository;
	
	 private static final Logger logger = LoggerFactory.getLogger(ZoomMeetAccountController.class);

	
	public ResponseEntity<?>SaveAccountDetails( ZoomAccountKeys accountdetails , String token){
		 try {
	         String email=jwtUtil.getEmailFromToken(token); 
	         Optional<Muser> opuser=muserRepository.findByEmail(email);
	         if(opuser.isPresent()) {
	        	 Muser user=opuser.get();
	        	 String role=user.getRole().getRoleName();
	        	 String InstitutionName=user.getInstitutionName();
	        	 if("ADMIN".equals(role)) {
	        		 accountdetails.setInstitution_name(InstitutionName);
	        		 zoomacrepo.save(accountdetails);
	        		 return ResponseEntity.ok("Data Saved SuccessFully");
	        	 }else {
	        		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        	 }
	         }else {
	        	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user not Found");
	         }
	         
		  } catch (Exception e) {
			  e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }
	}
	
	public ResponseEntity<?>EditAccountDetails( ZoomAccountKeys accountdetails , String token){
		 try {
	         String email=jwtUtil.getEmailFromToken(token); 
	         Optional<Muser> opuser=muserRepository.findByEmail(email);
	         if(opuser.isPresent()) {
	        	 Muser user=opuser.get();
	        	 String role=user.getRole().getRoleName();
	        	 if("ADMIN".equals(role)) {
	        		 zoomacrepo.save(accountdetails);
	        		 return ResponseEntity.ok("Data Saved SuccessFully");
	        	 }else {
	        		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        	 }
	         }else {
	        	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user not Found");
	         }
	         
		  } catch (Exception e) {
			  e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }
	}
   
    public ResponseEntity<?> getMethodName(String token) {
    	 try {
	         String email=jwtUtil.getEmailFromToken(token); 
	         Optional<Muser> opuser=muserRepository.findByEmail(email);
	         if(opuser.isPresent()) {
	        	 Muser user=opuser.get();
	        	 String role=user.getRole().getRoleName();
	        	 String InstitutionName=user.getInstitutionName();
	        	 if("ADMIN".equals(role)) {
	        		 Optional<ZoomAccountKeys> opaccountsettings=zoomacrepo.findbyInstitutionName(InstitutionName);
	        		 if(opaccountsettings.isPresent()) {
	        			 ZoomAccountKeys accountset=opaccountsettings.get();
	        			 return ResponseEntity.ok(accountset);
	        		 }else {
	    	        	 return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	        	 }
	        	 }else {
	        		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        	 }
	         }else {
	        	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user not Found");
	         }
	         
		  } catch (Exception e) {
			  e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }

	        	 }
    
  
   //SysAdmin------------------------------------------------------
    
	public ResponseEntity<?>SaveAccountDetailsSYS( ZoomAccountKeys accountdetails ,String token){
		 try {
	         String role=jwtUtil.getRoleFromToken(token);
	       
	        	 if("SYSADMIN".equals(role)) {
	        		 accountdetails.setInstitution_name("SYSADMIN");
	        		 zoomacrepo.save(accountdetails);
	        		 return ResponseEntity.ok("Data Saved SuccessFully");
	        	 }else {
	        		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        	 }
	         
	         
		  } catch (Exception e) {
			  e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }
	}
    

	public ResponseEntity<?>EditAccountDetailsSYS( ZoomAccountKeys accountdetails , String token){
		 try {
	         String role=jwtUtil.getRoleFromToken(token); 
	        
	        	 if("SYSADMIN".equals(role)) {
	        		 zoomacrepo.save(accountdetails);
	        		 return ResponseEntity.ok("Data Saved SuccessFully");
	        	 }else {
	        		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        	 }
	        
	         
		  } catch (Exception e) {
			  e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }
    
}
    
    
    public ResponseEntity<?> getMethodNameSYS( String token) {
    	 try {
	         String role=jwtUtil.getRoleFromToken(token); 
	        
	        	 if("SYSADMIN".equals(role)) {
	        		 Optional<ZoomAccountKeys> opaccountsettings=zoomacrepo.findbyInstitutionName("SYSADMIN");
	        		 if(opaccountsettings.isPresent()) {
	        			 ZoomAccountKeys accountset=opaccountsettings.get();
	        			 return ResponseEntity.ok(accountset);
	        		 }else {
	    	        	 return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	        	 }
	        	 }else {
	        		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        	 }
	        
	         
		  } catch (Exception e) {
			  e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		                .body("An error occurred while updating the certificate: " + e.getMessage() );
		    }

	        	 }
   
    
    
    
}
