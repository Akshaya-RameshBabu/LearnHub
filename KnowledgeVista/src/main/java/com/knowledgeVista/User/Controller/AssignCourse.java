package com.knowledgeVista.User.Controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Course.CourseDetailDto;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class AssignCourse {
	@Autowired
	private MuserRepositories muserRepository;
	@Autowired
	private CourseDetailRepository courseDetailRepository;
	@Autowired
	 private JwtUtil jwtUtil;
	 @Autowired
		private NotificationService notiservice;
	 
	 private static final Logger logger = LoggerFactory.getLogger(AssignCourse.class);
public ResponseEntity<List<CourseDetailDto>> getCoursesForUser( String token) {
		try{
        String role = jwtUtil.getRoleFromToken(token);
        String email = jwtUtil.getEmailFromToken(token);
		if("USER".equals(role)) {
			 List<CourseDetailDto> courses=muserRepository.findStudentAssignedCoursesByEmail(email);
		        return ResponseEntity.ok(courses);
	        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}catch(Exception e){
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	    }

public ResponseEntity<List<CourseDetailDto>> getCoursesForTrainer(String token) {
	try{
    String role = jwtUtil.getRoleFromToken(token);
    String email = jwtUtil.getEmailFromToken(token);
	if("TRAINER".equals(role)) {
		 List<CourseDetailDto> courses=muserRepository.findAllotedCoursesByEmail(email);
  
        return ResponseEntity.ok(courses);
        }

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	}catch(Exception e){
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
}

	
}
