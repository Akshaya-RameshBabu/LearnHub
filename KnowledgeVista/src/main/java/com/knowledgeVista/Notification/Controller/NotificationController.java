package com.knowledgeVista.Notification.Controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.knowledgeVista.Notification.NotificationDetails;
import com.knowledgeVista.Notification.NotificationUser;
import com.knowledgeVista.Notification.Repositories.NotificationDetailsRepo;
import com.knowledgeVista.Notification.Repositories.NotificationUserRepo;
import com.knowledgeVista.Notification.dtos.NotificationDetailsDTO;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@CrossOrigin
@RestController
public class NotificationController {
	 @Autowired
	 private JwtUtil jwtUtil;
	 @Autowired
	 private MuserRepositories muserRepository;
	 @Autowired
		private NotificationDetailsRepo notidetailRepo;
		@Autowired
		private NotificationUserRepo notiuserRepo;
		
		 private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

		

	
		    public ResponseEntity<?> GetNotiImage( String token, List<Long> notifyIds) {
		        try {
		            String email = jwtUtil.getEmailFromToken(token);
		            Optional<Muser> opmuser = muserRepository.findByEmail(email);

		            if (opmuser.isPresent()) {
		                opmuser.get();
		                if (notifyIds == null || notifyIds.isEmpty()) {
		                    return ResponseEntity.badRequest().body("Notification ID list cannot be empty.");
		                }
		                // Fetch images for the notification IDs in the list
		                List<NotificationDetails> notificationsWithImages = notidetailRepo.findNotificationsWithImagesByNotifyIdIn(notifyIds);

		          
             return ResponseEntity.ok(notificationsWithImages);
		               
		               
		            } else {
		                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
		            }
		        } catch (Exception e) {
		        	  e.printStackTrace();    logger.error("", e);;
		            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching images.");
		        }
		    }
		 
		public ResponseEntity<?> GetAllNotification(String token) {
		    try {
		        String email = jwtUtil.getEmailFromToken(token);
		        Optional<Muser> opmuser = muserRepository.findByEmail(email);

		        if (opmuser.isPresent()) {
		            Muser user = opmuser.get();
		            String institution = user.getInstitutionName();
		            boolean adminIsactive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);

		            if (!adminIsactive) {
		                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		            }

		            LocalDate today = LocalDate.now();
		            List<Long> ids = notiuserRepo.findNotificationIdsByUserId(user.getUserId(), today);

		            List<NotificationDetailsDTO> notimap = new ArrayList<>();

		            for (Long id : ids) {
		                Optional<NotificationDetailsDTO> opNotiDetails = notidetailRepo.findCustomNotificationById(id);

		                if (opNotiDetails.isPresent()) {
		                	NotificationDetailsDTO notification = opNotiDetails.get();

		                    
		                        notimap.add(notification);
		                    }
		                
		            }

		            return ResponseEntity.ok(notimap);
		        } else {
		            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		        }

		    } catch (Exception e) {
		        e.printStackTrace();    logger.error("", e);;
		        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		    }
		}

	
	public ResponseEntity<?> MarkALLasRead(String token ,  List<Long> notiIds){
		try {
			String email= jwtUtil.getEmailFromToken(token);
		    Optional<Muser> opuser=muserRepository.findByEmail(email);
		    if(opuser.isPresent()) {
		    	Muser user=opuser.get();
		    	 boolean adminIsactive=muserRepository.getactiveResultByInstitutionName("ADMIN", user.getInstitutionName());
		   	    	if(!adminIsactive) {
		   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		   	    	}
				for(Long id :notiIds) {
					NotificationUser notiuser= notiuserRepo.findbyuserIdNotificationId(user.getUserId(), id);
					notiuser.setIs_read(true);
					notiuserRepo.save(notiuser);
				}
				return ResponseEntity.ok().body("");
		    }else {
		    	return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		    }
			
		}catch (Exception e) {
		        // If an error occurs, return 500
			e.printStackTrace();    logger.error("", e);;
		    	  return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		    	            .body("{\"error\": \"An error occurred while processing the request.\"}");
		    	     }
	 }
	
	public ResponseEntity<?> UreadCount(String token) {
		try {
	         String email=jwtUtil.getEmailFromToken(token);
	         Optional<Muser> opmuser= muserRepository.findByEmail(email);
	         if(opmuser.isPresent()) {
	        	 Muser user=opmuser.get();
	        	 boolean adminIsactive=muserRepository.getactiveResultByInstitutionName("ADMIN", user.getInstitutionName());
		   	    	if(!adminIsactive) {
		   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		   	    	}
	        	 LocalDate today=LocalDate.now();
	        	 Long count=notiuserRepo.CountUnreadNotificationOftheUser(user.getUserId(), false,today);
	        	 return ResponseEntity.ok(count);
	         }else {
	        	 return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	         }
	         
		
	}catch (Exception e) {
		e.printStackTrace();    logger.error("", e);;
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
    }

}
	
	public ResponseEntity<?>ClearAll(String token){
		try {
         String email=jwtUtil.getEmailFromToken(token);
         Optional<Muser> opmuser= muserRepository.findByEmail(email);
         if(opmuser.isPresent()) {
        	 Muser user=opmuser.get();
        	 boolean adminIsactive=muserRepository.getactiveResultByInstitutionName("ADMIN", user.getInstitutionName());
	   	    	if(!adminIsactive) {
	   	    	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	   	    	}
        	 Long id=user.getUserId();
        	 List<Long> ids=notiuserRepo.findprimaryIdsByUserId(id);
        	 for(Long singleid :ids) {
        		 notiuserRepo.deleteById(singleid);
        	 }
        	 return ResponseEntity.ok().build();
         }else {
        	 return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); 
         }
		}catch (Exception e) {
			e.printStackTrace();    logger.error("", e);;
             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
         }
	}
}