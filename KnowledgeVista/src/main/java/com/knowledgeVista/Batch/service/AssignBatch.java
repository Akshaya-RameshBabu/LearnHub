package com.knowledgeVista.Batch.service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
@Service
public class AssignBatch {
	@Autowired
	private MuserRepositories muserRepository;
	@Autowired
	private BatchRepository batchRepo;
	@Autowired
	 private JwtUtil jwtUtil;
	 @Autowired
		private NotificationService notiservice;
	 @Autowired
	 private EmailService emailService;
	 
	 private static final Logger logger = LoggerFactory.getLogger(AssignBatch.class);
	 @Transactional
	 public ResponseEntity<?> assignCoursesToUser(HttpServletRequest request, Long userId,  Long BatchId, String token) {
	     try {
	         // ✅ Fetch admin user details once
	         Optional<Muser> opUser = muserRepository.findByEmail(jwtUtil.getEmailFromToken(token));
	         if (opUser.isEmpty()) {
	             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	         }
	         
	         Muser adminUser = opUser.get();
	         String institution = adminUser.getInstitutionName();
	         boolean adminIsActive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
	         if (!adminIsActive) {
	             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	         }

	         // ✅ Check role
	         String role = adminUser.getRole().getRoleName();
	         if (!"ADMIN".equals(role) && !"TRAINER".equals(role)) {
	             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	         }

	         // ✅ Fetch user once
	         Optional<Muser> optionalUser = muserRepository.findById(userId);
	         if (optionalUser.isEmpty()) {
	             return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                 .body("{\"error\": \"User with ID " + userId + " not found.\"}");
	         }
	         Muser user = optionalUser.get();

	         // ✅ Only proceed for "USER" role
	         if (!"USER".equals(user.getRole().getRoleName())) {
	             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
	                 .body("{\"error\": \"The specified user is not a USER.\"}");
	         }
	         Optional<Batch> opbatch=batchRepo.findById(BatchId);
	         if(opbatch.isPresent()) {
	        	 Batch batch=opbatch.get();
	           if(batch.getNoOfSeats()<batch.getUserCountinBatch()+1) {
	        	   return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Seats Filled...!");
	           }
	         List<CourseDetail>courses= batch.getCourses();
				if (!user.getEnrolledbatch().contains(batch)) {
					user.getEnrolledbatch().add(batch);
					muserRepository.save(user);
				}
				if (!batch.getUsers().contains(user)) {
					batch.getUsers().add(user);
					batchRepo.save(batch);
				}
				user.getCourses().addAll(
					    courses.stream()
					           .filter(course -> !user.getCourses().contains(course)) // Filter out existing courses
					           .toList() // Collect remaining courses into a list
					);
					muserRepository.save(user);
			         String message = "Batch assigned to user successfully.";
			         List<Long>trainerList=new ArrayList<Long>();
			         for(Muser tr:batch.getTrainers()) {
			        	 trainerList.add(tr.getUserId());
			         }
                     createAndSendNotification(user, batch, trainerList, adminUser.getUsername(), institution,false);
                     sendEnrollmentMail(request, courses, batch, user,"USER");
			         return ResponseEntity.ok( message );
	         }else {
	        	 return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
	         }


	     } catch (Exception e) {
	         logger.error("Error in assignCoursesToUser", e);
	         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	             .body("{\"error\": \"An error occurred while processing the request.\"}");
	     }
	 }
	
		public void sendEnrollmentMail(HttpServletRequest request,List<CourseDetail> courses,Batch batch,Muser student ,String type) {
			List<String> bcc = null;
			List<String> cc = null;
			String institutionname = student.getInstitutionName();
		       String domain = request.getHeader("origin"); // Extracts the domain dynamically

		         // Fallback if "Origin" header is not present (e.g., direct backend requests)
		         if (domain == null || domain.isEmpty()) {
		             domain = request.getScheme() + "://" + request.getServerName();
		             if (request.getServerPort() != 80 && request.getServerPort() != 443) {
		                 domain += ":" + request.getServerPort();
		             }
		         }

		         // Construct the Sign-in Link
		         String signInLink = domain + "/login";
		         DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d-MMM-yyyy"); // Example: 5-Jan-2025
		         String formattedStartDate = batch.getStartDate().format(formatter);
		         String formattedEndDate = batch.getEndDate().format(formatter);
		         StringBuilder body = new StringBuilder();
		         if("TRAINER".equals(type)) {
		        	 body.append("<html>")
		             .append("<body>")
		             .append("<h2>Welcome to LearnHub - Your Trainer Journey Begins!</h2>")
		             .append("<p>Dear ").append(student.getUsername()).append(",</p>")
		             .append("<p>Congratulations! You have been successfully assigned as a trainer for <strong>Batch: ")
		             .append(batch.getBatchTitle()).append(" (").append(formattedStartDate).append(" to ").append(formattedEndDate).append(")</strong> at LearnHub.</p>")
		             .append("<p>We are thrilled to have you on board! As a trainer, you play a vital role in shaping the learning experience of your students.</p>")
		             
		             .append("<h3>Your Responsibilities:</h3>")
		             .append("<ul>")
		             .append("<li>Deliver high-quality and engaging training sessions.</li>")
		             .append("<li>Provide mentorship and guidance to students throughout the batch.</li>")
		             .append("<li>Share valuable insights, practical knowledge, and real-world examples.</li>")
		             .append("<li>Encourage active participation and discussions.</li>")
		             .append("<li>Track student progress and provide constructive feedback.</li>")
		             .append("</ul>")
		             
		             .append("<h3>Courses You Will Handle:</h3>")
		             .append("<ul>").append(generateCourseList(batch.getCourses())).append("</ul>")

		             .append("<h3>Getting Started:</h3>")
		             .append("<ul>")
		             .append("<li>Log in to your LearnHub account.</li>")
		             .append("<li>Review your assigned courses in the <strong>My Courses</strong> tab.</li>")
		             .append("<li>Set up your training schedule and communicate with students.</li>")
		             .append("<li>Utilize resources, tools, and discussion forums to enhance the learning experience.</li>")
		             .append("</ul>")

		             .append("<h3>Exclusive Trainer Benefits:</h3>")
		             .append("<ul>")
		             .append("<li>Access to premium teaching materials and resources.</li>")
		             .append("<li>Recognition as a certified LearnHub trainer.</li>")
		             .append("<li>Opportunities for career growth and networking.</li>")
		             .append("<li>Support from our dedicated trainer community and technical team.</li>")
		             .append("</ul>")

		             .append("<p>We are here to support you every step of the way! If you have any questions, feel free to reach out to our support team.</p>")
		             .append("<p>Click the link below to sign in and begin your journey:</p>")
		             .append("<p><a href='").append(signInLink).append("' style='font-size:16px; color:blue;'>Sign In to Your Trainer Dashboard</a></p>")

		             .append("<p>Wishing you a successful and fulfilling training experience!</p>")
		             .append("<p>Best Regards,<br><strong>LearnHub Team</strong></p>")
		             .append("</body>")
		             .append("</html>");

		         }else {
		       
		         body.append("<html>")
		             .append("<body>")
		             .append("<h2>Welcome to LearnHub - Your Learning Journey Begins!</h2>")
		             .append("<p>Dear ").append(student.getUsername()).append(",</p>")
		             .append("<p>Congratulations! You have been successfully enrolled in <strong>Batch: ")
		             .append(batch.getBatchTitle()).append(" (").append(formattedStartDate).append(" to ").append(formattedEndDate).append(")</strong> at LearnHub.</p>")
		             .append("<p>In this batch, you will be learning the below courses:</p>")
		             .append("<ul>").append(generateCourseList(batch.getCourses())).append("</ul>")
		             .append("<p>To get started:</p>")
		             .append("<ul>")
		             .append("<li>Log in to your LearnHub account.</li>")
		             .append("<li>Access your enrolled courses in My Courses Tab.</li>")
		             .append("<li>Engage with trainers and fellow students.</li>")
		             .append("<li>Complete assignments and track your progress.</li>")
		             .append("</ul>")
		             .append("<p>If you need any assistance, our support team is here to help.</p>")
		             .append("<p>Click the link below to sign in:</p>")
		             .append("<p><a href='").append(signInLink).append("' style='font-size:16px; color:blue;'>Sign In</a></p>")
		             .append("<p>Best Regards,<br>LearnHub Team</p>")
		             .append("</body>")
		             .append("</html>");

		         }
			if (institutionname != null && !institutionname.isEmpty()) {
			    try {
			        List<String> emailList = new ArrayList<>();
			        emailList.add(student.getEmail());
			        emailService.sendHtmlEmailAsync(
			            institutionname, 
			            emailList,
			            cc, 
			            bcc, 
			            "Welcome to LearnHub - Batch Enrollment Successful!", 
			            body.toString()
			        );
			    } catch (Exception e) {
			        logger.error("Error sending mail: " + e.getMessage());
			    }
			}

			// Helper method to format courses as an HTML list
			

		}
		private String generateCourseList(List<CourseDetail> courses) {
		    StringBuilder courseList = new StringBuilder();
		    for (CourseDetail course : courses) {
		        courseList.append("<li>").append(course.getCourseName()).append("</li>");
		    }
		    return courseList.toString();
		}
		
////============================Assign Batch To Trainer====================================
		 @Transactional
		 public ResponseEntity<?> assignBatchesToTrainer(HttpServletRequest request, Long userId,  Long BatchId, String token) {
		     try {
		         // ✅ Fetch admin user details once
		         Optional<Muser> opUser = muserRepository.findByEmail(jwtUtil.getEmailFromToken(token));
		         if (opUser.isEmpty()) {
		             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		         }
		         
		         Muser adminUser = opUser.get();
		         String institution = adminUser.getInstitutionName();
		         boolean adminIsActive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
		         if (!adminIsActive) {
		             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		         }

		         // ✅ Check role
		         String role = adminUser.getRole().getRoleName();
		         if (!"ADMIN".equals(role)) {
		             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		         }

		         // ✅ Fetch user once
		         Optional<Muser> optionalUser = muserRepository.findById(userId);
		         if (optionalUser.isEmpty()) {
		             return ResponseEntity.status(HttpStatus.NOT_FOUND)
		                 .body("{\"error\": \"Trainer with ID " + userId + " not found.\"}");
		         }
		         Muser user = optionalUser.get();

		         // ✅ Only proceed for "TRAINER" role
		         if (!"TRAINER".equals(user.getRole().getRoleName())) {
		             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
		                 .body("{\"error\": \"The specified user is not a TRAINER.\"}");
		         }
		         Optional<Batch> opbatch=batchRepo.findById(BatchId);
		         if(opbatch.isPresent()) {
		        	 Batch batch=opbatch.get();
		          
		         List<CourseDetail>courses= batch.getCourses();
					if (!user.getBatches().contains(batch)) {
						user.getBatches().add(batch);
						muserRepository.save(user);
					}
					if (!batch.getTrainers().contains(user)) {
						batch.getTrainers().add(user);
						batchRepo.save(batch);
					}
					user.getAllotedCourses().addAll(
						    courses.stream()
						           .filter(course -> !user.getAllotedCourses().contains(course)) // Filter out existing courses
						           .toList() // Collect remaining courses into a list
						);
						muserRepository.save(user);
				         String message = "Batch assigned to Trainer successfully.";
				        
	                     createAndSendNotification(user, batch,null, adminUser.getUsername(), institution,true);
	                     sendEnrollmentMail(request, courses, batch, user,"TRAINER");
				         return ResponseEntity.ok( message );
		         }else {
		        	 return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
		         }


		     } catch (Exception e) {
		         logger.error("Error in assignCoursesToUser", e);
		         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
		             .body("{\"error\": \"An error occurred while processing the request.\"}");
		     }
		 }
		 
		 private void createAndSendNotification(Muser user, Batch batch, List<Long> trainerList, String addingEmail, String institution, boolean isTrainer) {
			    try {
			        List<Long> userList = new ArrayList<>();
			        userList.add(user.getUserId());

			        // Notification for the user (Trainer or Student)
			        String heading = "New Batch Assigned!";
			        String link = isTrainer ? "/AssignedCourses" : "/mycourses"; // Trainer and Student have different links
			        String notiDescription = "A batch " + batch.getBatchTitle() + " was assigned to you";

			        Long notifyId = notiservice.createNotification("CourseAssigned", user.getUsername(), notiDescription, addingEmail, heading, link, batch.getBatchImage());
			        if (notifyId != null) {
			            notiservice.SpecificCreateNotification(notifyId, userList);
			        }

			        // If it's a student, notify the trainers
			        if (!isTrainer && trainerList != null && !trainerList.isEmpty()) {
			            String headingT = "New Student Assigned!";
			            String linkT = "/view/Student/profile/" + user.getEmail();
			            String notiDescriptionT = "A New Student " + user.getUsername() + " was assigned to your batch " + batch.getBatchTitle();

			            Long notifyIdT = notiservice.createNotification("StudentAssigned", user.getUsername(), notiDescriptionT, addingEmail, headingT, linkT, user.getProfile());
			            if (notifyIdT != null) {
			                notiservice.SpecificCreateNotification(notifyIdT, trainerList);
			            }
			        }

			        // Admin notification
			        String headingA = isTrainer ? "Batch Assigned to Trainer!" : "Batch Assigned to Student!";
			        String linkA = isTrainer ? "/assignCourse/Trainer/" + user.getUserId() : "/assignCourse/Student/" + user.getUserId();
			        String notiDescriptionA = "A batch " + batch.getBatchTitle() + " was assigned to " + user.getUsername();

			        Long notifyIdA = notiservice.createNotification("StudentAssigned", user.getUsername(), notiDescriptionA, addingEmail, headingA, linkA, user.getProfile());
			        if (notifyIdA != null) {
			            List<String> admin = new ArrayList<>();
			            admin.add("ADMIN");
			            notiservice.CommoncreateNotificationUser(notifyIdA, admin, institution);
			        }

			    } catch (Exception e) {
			        logger.error("Error in notification", e);
			    }
			}
		 

}
