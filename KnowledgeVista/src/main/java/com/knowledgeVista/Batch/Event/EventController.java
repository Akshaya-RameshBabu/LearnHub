package com.knowledgeVista.Batch.Event;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class EventController {
	    @Autowired
	    private JwtUtil jwtUtil;
	    @Autowired
	    private MuserRepositories muserRepo;
	    @Autowired
	    private EventService eventservice;
	    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
	    
	    public ResponseEntity<?>getEvents(String token,int pageNumber,int pageSize){
	    	try {
		         String email = jwtUtil.getEmailFromToken(token);
		         Long userId=muserRepo.findidByEmail(email);
		         if(userId==null) {
		        	 return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized User Id Not Found");
		         }
		         List<Long>batchids=muserRepo.findBatchIdsByEmail(email);
		         Map<String, Object> events=eventservice.getEventsForBatch(batchids,userId,pageNumber,pageSize);
		        return ResponseEntity.ok(events);
		         
	    	}catch (Exception e) {
				// TODO: handle exception
	    		logger.error("error in getting Events" + e);
	    		e.printStackTrace();
	    		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			}
	    }

}
