package com.knowledgeVista.Attendance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.knowledgeVista.Attendance.Repo.AttendanceRepo;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;


@Service
public class AttendanceService {
	@Autowired
	private AttendanceRepo attendanceRepo;
	 @Autowired
	 private JwtUtil jwtUtil;
	 @Autowired
		private MuserRepositories muserRepository;
	private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

	
	public ResponseEntity<?> getAttendance(String token, Long userId,Long batchId, Pageable pageable) {
	    try {
	        String role = jwtUtil.getRoleFromToken(token);
	        if (userId == null) {
	            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	        }
	        if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
	            Page<AttendanceDto> attendancePage = attendanceRepo.findAttendanceByUserId(userId,batchId, pageable);
	            double percentage = calculateAttendance(userId,batchId);
	            Map<String, Object> response = new HashMap<>();
	            response.put("attendance", attendancePage);
	            response.put("percentage", percentage);
	            return ResponseEntity.ok(response);
	        } else {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Students Cannot access This Page");
	        }
	    } catch (Exception e) {
	        logger.error("Error at getAttendance in AttendanceService for user ID {}: {}", e.getMessage());
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching attendance data");
	    }
	}
	

public ResponseEntity<?> GetAttendanceAnalysis(String token,Long userId, Long batchId) {
    Map<String, Object> attendanceData = new HashMap<>();
    
    try {
	        String role = jwtUtil.getRoleFromToken(token);
	        if("ADMIN".equals(role)||"TRAINER".equals(role)) {
        Long totalDays = attendanceRepo.countClassesForUserAndBatch(userId, batchId);
        Long presentDays = attendanceRepo.countClassesPresentForUser(userId, batchId);
        Long absentDays = totalDays - presentDays;

        if (totalDays == null || totalDays == 0) {
            attendanceData.put("totalDays", 0);
            attendanceData.put("presentDays", 0);
            attendanceData.put("absentDays", 0);
            attendanceData.put("presentPercentage", 0.0);
            attendanceData.put("absentPercentage", 0.0);
            return ResponseEntity.ok(attendanceData);
        }

        double presentPercentage = ((double) presentDays / totalDays) * 100;
        double absentPercentage = ((double) absentDays / totalDays) * 100;

        // Round to 2 decimal places
        BigDecimal roundedPresentPercentage = new BigDecimal(presentPercentage).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roundedAbsentPercentage = new BigDecimal(absentPercentage).setScale(2, RoundingMode.HALF_UP);

        // Add values to the map
        attendanceData.put("totalDays", totalDays);
        attendanceData.put("presentDays", presentDays);
        attendanceData.put("absentDays", absentDays);
        attendanceData.put("presentPercentage", roundedPresentPercentage.doubleValue());
        attendanceData.put("absentPercentage", roundedAbsentPercentage.doubleValue());

        return ResponseEntity.ok(attendanceData);
	        }else {
	        	return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("users Cannot access this page");
	        }
        
    } catch (Exception e) {
        logger.error("Error calculating attendance percentage: " + e.getMessage());
        return ResponseEntity.status(500).body("Error calculating attendance percentage");
    }
}	public double calculateAttendance(Long userId,Long batchId) {
		  try {
			  Long totalOccurance=attendanceRepo.countClassesForUserAndBatch(userId,batchId);
			  Long presentCount=attendanceRepo.countClassesPresentForUser(userId,batchId);
			  if (totalOccurance == null || totalOccurance == 0) {
				    return 0.0; // Avoid division by zero
				}

				double percentage = ((double) presentCount / totalOccurance) * 100;
				  BigDecimal roundedPercentage = new BigDecimal(percentage).setScale(2, RoundingMode.HALF_UP);
			        return roundedPercentage.doubleValue();
			  
		  }catch (Exception e) {
			
			  logger.error("error calculating AttendancePercentage"+e);
			  return -1.0;
		}
	  }
public ResponseEntity<?>updateAttendance(String token,Long id,String status){
	try { 	
        String role=jwtUtil.getRoleFromToken(token); 
        if("ADMIN".equals(role)||"TRANER".equals(role)) {
        	Optional<Attendancedetails>opattendance= attendanceRepo.findById(id);
        	if(opattendance.isPresent()) {
        		Attendancedetails attendance=opattendance.get();
        		if("PRESENT".equals(status)||"ABSENT".equals(status)) {
        		attendance.setStatus(status);
        		}
        		attendanceRepo.save(attendance);
        		return ResponseEntity.ok("saved");
        	}else {
        		return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Attendance Not Found");
        	}
        }else {
        	return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Student cannot access this Page");
        }
	}catch (Exception e) {
		// TODO: handle exception
		logger.error("Error Updating Attendance"+e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
}
public ResponseEntity<?> getMyAttendance(String token,Long batchId, Pageable pageable) {
    try { 	
	         String role=jwtUtil.getRoleFromToken(token); 
	         if("USER".equals(role)) {
	        	 String email=jwtUtil.getEmailFromToken(token);
	        	 Long userId=muserRepository.findidByEmail(email);
	        	 if(userId==null) {
	        		 return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	        	 }
	        	 Page<AttendanceDto> attendancePage = attendanceRepo.findAttendanceByUserId(userId,batchId, pageable);		          
	        	 double percentage = calculateAttendance(userId,batchId);
		            Map<String, Object> response = new HashMap<>();
		            response.put("attendance", attendancePage);
		            response.put("percentage", percentage);
		            return ResponseEntity.ok(response);
	         }else
	         {return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Only Students Can access This Page");      
	    	 
	         }
    } catch (Exception e) {
        logger.error("Error at getAttendance in AttendanceService for user ID {}: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching attendance data");
    }
}
}
