package com.knowledgeVista.User.LabellingItems.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.LabellingItems.FooterDetails;
import com.knowledgeVista.User.LabellingItems.Repo.FooterdetailsRepo;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@RestController
@CrossOrigin
public class FooterDetailsController {
	@Autowired
	private FooterdetailsRepo footerrepo;
	@Autowired
	private MuserRepositories muserrepositories;
	 @Autowired
	 private JwtUtil jwtUtil;

	 public ResponseEntity<?>SaveFooterDetails(String token, FooterDetails footerdetails){
		  try {
	   	     String role = jwtUtil.getRoleFromToken(token);
	   	     if(!"ADMIN".equals(role)) {
	   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	   	     }
	   	     String email=jwtUtil.getEmailFromToken(token);
	   	     Optional<Muser>opreq=muserrepositories.findByEmail(email);
	   	     String institution="";
	   	     if(opreq.isPresent()) {
	   	    	 Muser requser=opreq.get();
	   	    	institution=requser.getInstitutionName();
	   	    	Optional<FooterDetails> footer = footerrepo.FindFooterDetailsByInstitution(institution);
	   	    	if(footer.isPresent()) {
	   	    		FooterDetails existingFooter=footer.get();
	   	    		existingFooter.setContact(footerdetails.getContact());
	   	    		existingFooter.setCopyright(footerdetails.getCopyright());
	   	    		existingFooter.setInstitutionmail(footerdetails.getInstitutionmail());
	   	    		existingFooter.setSupportmail(footerdetails.getSupportmail());
	   	    		footerrepo.save(existingFooter);
	   	    	   return ResponseEntity.ok("Updated");
	   	  } else {
	   	      FooterDetails footernew = new FooterDetails();
	   	      footernew.setContact(footerdetails.getContact());
	   	      footernew.setCopyright(footerdetails.getCopyright());
	   	      footernew.setInstitutionmail(footerdetails.getInstitutionmail());
	   	      footernew.setSupportmail(footerdetails.getSupportmail());
	   	      footernew.setInstitutionName(institution);
	   	      footerrepo.save(footernew);
	   	    	return ResponseEntity.ok("saved");
	   	    	}
	 }else {
		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	 }
		  }catch (Exception e) {
		    e.printStackTrace();
		    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
}
	 public ResponseEntity<?>Getfooterdetails(String token){
		  try {
	   	     String role = jwtUtil.getRoleFromToken(token);
	   	     if(!"ADMIN".equals(role)) {
	   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	   	     }
	   	     String email=jwtUtil.getEmailFromToken(token);
	   	     Optional<Muser>opreq=muserrepositories.findByEmail(email);
	   	     String institution="";
	   	     if(opreq.isPresent()) {
	   	    	 Muser requser=opreq.get();
	   	    	institution=requser.getInstitutionName();
	   	    	Optional<FooterDetails>footerdetsils=footerrepo.FindFooterDetailsByInstitution(institution);
	   	       if(footerdetsils.isPresent()) {
	   	    	   return ResponseEntity.ok(footerdetsils);
	   	       }else {
	   	    	   return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	   	       }
		            
	  }else {
		 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	 }
		  }catch (Exception e) {
		    e.printStackTrace();
		    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
}
	 public ResponseEntity<?>getFooteritemsForAll(){
		 try {
			 String instutionname=muserrepositories.getInstitution("ADMIN");
			 if(instutionname == null ||instutionname.isEmpty()) {
				 return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
			 }else {
				 Optional<FooterDetails>footerdetails= footerrepo.FindFooterDetailsByInstitution(instutionname);
		   	       if(footerdetails.isPresent()) {
		   	    	   return ResponseEntity.ok(footerdetails);
		   	       }else {
		   	    	   return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
		   	       }
			 }
		 }catch(Exception e) {
			 e.printStackTrace();
			 return ResponseEntity.internalServerError().build();
		 }
	 
	 }

}
