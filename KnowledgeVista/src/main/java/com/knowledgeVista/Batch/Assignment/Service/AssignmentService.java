package com.knowledgeVista.Batch.Assignment.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.Assignment.Assignment;
import com.knowledgeVista.Batch.Assignment.Assignment.AssignmentType;
import com.knowledgeVista.Batch.Assignment.AssignmentQuestion;
import com.knowledgeVista.Batch.Assignment.AssignmentSchedule;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentQuesstionRepo;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentRepo;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentSheduleRepo;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AssignmentService {
	@Autowired
	private AssignmentRepo assignmentRepo;
	@Autowired
	private AssignmentQuesstionRepo QuestionRepo;
	@Autowired
	private CourseDetailRepository courseDetailRepo;
	@Autowired
	private MuserRepositories muserRepo;
	@Autowired
	private BatchRepository batchRepo;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private AssignmentSheduleRepo sheduleRepo;
	@Autowired
	private NotificationService notiservice;
	@Autowired
	private EmailService emailService;
	private static final Logger logger = LoggerFactory.getLogger(AssignmentService.class);

	public ResponseEntity<?> saveAssignment(String token, Assignment assignment, Long courseId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<CourseDetail> optionalcourse = courseDetailRepo.findById(courseId);
			if (optionalcourse.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Course Not Found");
			}
			CourseDetail Course = optionalcourse.get();
			if ("ADMIN".equals(role)) {
				return saveAssignmentService(assignment, Course);
			} else if ("TRAINER".equals(role)) {
				if (Course.getTrainer().contains(addingUser)) {
					return saveAssignmentService(assignment, Course);
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
			}
		} catch (Exception e) {
			logger.error("Error Saving Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred in Saving Assignment: " + e.getMessage());
		}
	}

	private ResponseEntity<?> saveAssignmentService(Assignment assignment, CourseDetail course) {
		try {
			assignment.setCourseDetail(course);
			if (assignment.getType().equals(AssignmentType.QA)) {
				if (assignment.getQuestions() != null) {
					assignment.getQuestions().forEach(question -> question.setAssignment(assignment));
				}
			} else if (assignment.getType().equals(AssignmentType.QUIZ)) {
				if (assignment.getQuestions() != null) {
					assignment.getQuestions().forEach(question -> question.setAssignment(assignment));
					Integer total = assignment.getQuestions().size();
					assignment.setTotalMarks(total);
				}
			}
			assignmentRepo.save(assignment);

			return ResponseEntity.ok("Assignment Saved Successfully");
		} catch (Exception e) {
			logger.error("Error at SaveAssignment Service", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error at Saving Assignment: " + e.getMessage());
		}
	}

	public ResponseEntity<?> GetAllAssignmentByCourse(String token, Long courseId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			String institutionName = addingUser.getInstitutionName();
			List<Map<String, Object>> assignments = assignmentRepo
					.findAssignmentDetailsWithoutCourseAndQuestions(courseId, institutionName);

			return ResponseEntity.ok(assignments);
		} catch (Exception e) {
			logger.error("Error Occured Getting Assignment By courseId" + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
		}
	}

	public ResponseEntity<?> DeleteAssignment(String token, Long AssignmentId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<Assignment> opassignment = assignmentRepo.findById(AssignmentId);
			if (opassignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}
			Assignment assignment = opassignment.get();
			CourseDetail Course = assignment.getCourseDetail();
			if ("ADMIN".equals(role)) {
				assignmentRepo.deleteById(AssignmentId);
				return ResponseEntity.ok("Assignment Deleted");
			} else if ("TRAINER".equals(role)) {
				if (Course.getTrainer().contains(addingUser)) {
					assignmentRepo.deleteById(AssignmentId);
					return ResponseEntity.ok("Assignment Deleted");
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
			}
		} catch (Exception e) {
			logger.error("Error Saving Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred in Deleting Assignment: ");
		}
	}

	public ResponseEntity<?> GetAssignmentByAssignmentId(String token, Long AssignmentId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Edit Assignment");
			}
			Optional<Assignment> opassignment = assignmentRepo.findById(AssignmentId);
			if (opassignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}
			Assignment assignment = opassignment.get();
			CourseDetail Course = assignment.getCourseDetail();
			if ("ADMIN".equals(role)) {
				assignment.setCourseDetail(null);
				assignment.setSchedules(null);
				assignment.setSubmissions(null);
				if (assignment.getQuestions() != null) {
					assignment.getQuestions().forEach(q -> q.setAssignment(null));
				}
				return ResponseEntity.ok(assignment);
			} else if ("TRAINER".equals(role)) {
				if (Course.getTrainer().contains(addingUser)) {
					assignment.setCourseDetail(null);
					assignment.setSchedules(null);
					assignment.setSubmissions(null);
					if (assignment.getQuestions() != null) {
						assignment.getQuestions().forEach(q -> q.setAssignment(null));
					}
					return ResponseEntity.ok(assignment);
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
			}
		} catch (Exception e) {
			logger.error("Error Saving Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred in Saving Assignment: " + e.getMessage());
		}
	}

	public ResponseEntity<?> updateAssignment(String token, Assignment updated, Long AssignmentId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<Assignment> opassignment = assignmentRepo.findById(AssignmentId);
			if (opassignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}
			Assignment assignment = opassignment.get();
			CourseDetail Course = assignment.getCourseDetail();
			if ("ADMIN".equals(role)) {
				if (updated.getDescription() != null) {
					assignment.setDescription(updated.getDescription());
				}
				if (updated.getTitle() != null) {
					assignment.setTitle(updated.getTitle());
				}
				if (updated.getTotalMarks() != null) {
					assignment.setTotalMarks(updated.getTotalMarks());
				}
				if (updated.getType().equals(AssignmentType.FILE_UPLOAD)) {
					assignment.setType(AssignmentType.FILE_UPLOAD);
					assignment.getQuestions().clear();
					if (updated.getMaxFileSize() != null) {
						assignment.setMaxFileSize(updated.getMaxFileSize());
					}
				}
				assignmentRepo.save(assignment);
				return ResponseEntity.ok("Updated");
			} else if ("TRAINER".equals(role)) {
				if (Course.getTrainer().contains(addingUser)) {
					if (updated.getDescription() != null) {
						assignment.setDescription(updated.getDescription());
					}
					if (updated.getTitle() != null) {
						assignment.setTitle(updated.getTitle());
					}
					if (updated.getTotalMarks() != null) {
						assignment.setTotalMarks(updated.getTotalMarks());
					}
					if (updated.getType().equals(AssignmentType.FILE_UPLOAD)) {
						assignment.setType(AssignmentType.FILE_UPLOAD);
						assignment.getQuestions().clear();
						if (updated.getMaxFileSize() != null) {
							assignment.setMaxFileSize(updated.getMaxFileSize());
						}
					}
					assignmentRepo.save(assignment);
					return ResponseEntity.ok("Updated");
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
			}
		} catch (Exception e) {
			logger.error("Error Saving Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred in Saving Assignment: " + e.getMessage());
		}
	}

	public ResponseEntity<?> DeleteAssignmentQuestionById(String token, Long questionId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<AssignmentQuestion> opassignmentQuestion = QuestionRepo.findById(questionId);
			if (opassignmentQuestion.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}
			AssignmentQuestion assignmentQuestion = opassignmentQuestion.get();
			CourseDetail Course = assignmentQuestion.getAssignment().getCourseDetail();
			if ("ADMIN".equals(role)) {
				QuestionRepo.deleteById(questionId);
				return ResponseEntity.ok("Deleted");
			} else if ("TRAINER".equals(role)) {
				if (Course.getTrainer().contains(addingUser)) {
					QuestionRepo.deleteById(questionId);
					return ResponseEntity.ok("Deleted");
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
			}
		} catch (Exception e) {
			logger.error("Error Deleting Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred in Saving Assignment: " + e.getMessage());
		}
	}

	public ResponseEntity<?> updateAssignmentQuestion(String token, List<AssignmentQuestion> updated,
			Long AssignmentId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<Assignment> opassignment = assignmentRepo.findById(AssignmentId);
			if (opassignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}
			Assignment assignment = opassignment.get();
			CourseDetail Course = assignment.getCourseDetail();
			if ("ADMIN".equals(role)) {
				assignment.getQuestions().clear(); // this triggers orphan removal
				updated.forEach(question -> question.setAssignment(assignment));
				assignment.getQuestions().addAll(updated); // set the new questions
				assignment.setType(AssignmentType.QA);
				assignmentRepo.save(assignment);
				return ResponseEntity.ok("Updated");
			} else if ("TRAINER".equals(role)) {
				if (Course.getTrainer().contains(addingUser)) {
					assignment.getQuestions().clear(); // this triggers orphan removal
					updated.forEach(question -> question.setAssignment(assignment));
					assignment.getQuestions().addAll(updated); // set the new questions
					assignmentRepo.save(assignment);

					return ResponseEntity.ok("Updated");
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
			}
		} catch (Exception e) {
			logger.error("Error Saving Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred in Saving Assignment: " + e.getMessage());
		}
	}

	public ResponseEntity<?> getAssignmentSheduleDetails(Long courseId, Long batchId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;

			if ("ADMIN".equals(role)) {
				isalloted = true;
			} else if ("TRAINER".equals(role)) {
				isalloted = muserRepo.FindAllotedOrNotByUserIdAndBatchId(email, batchId);
			}
			if (isalloted) {
				List<Map<String, Object>> shedule = assignmentRepo.getAssignmentSchedulesByCourseIdAndBatchId(courseId,
						batchId);
				return ResponseEntity.ok(shedule);
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Acces this Page");
		} catch (Exception e) {
			logger.error("error at GetSheduleQuizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

		}
	}

	public ResponseEntity<?> SaveORUpdateSheduleAssignment(HttpServletRequest request, Long AssignmentId, Long batchId,
			LocalDate AssignmentDate, String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addingUser = optionalUser.get();
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<Batch> opbatch = batchRepo.findById(batchId);
			if (opbatch.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
			}
			Batch batch = opbatch.get();
			Optional<Assignment> opassignment = assignmentRepo.findById(AssignmentId);
			if (opassignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}
			Assignment assignment = opassignment.get();
			CourseDetail Course = assignment.getCourseDetail();
			if ("ADMIN".equals(role) || ("TRAINER".equals(role) && Course.getTrainer().contains(addingUser))) {

				Optional<AssignmentSchedule> opshedule = sheduleRepo.findByAssignmentIdAndBatchId(batchId,
						AssignmentId);

				AssignmentSchedule schedule;
				if (opshedule.isPresent()) {
					schedule = opshedule.get();
					schedule.setAssignmentDate(AssignmentDate);
					sheduleRepo.save(schedule);
					String heading = "Assignment Sheduled !";
					String link = "/submitAssignment/" + batch.getId() + "/" + assignment.getId();
					DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
					String formattedDate = AssignmentDate.format(formatter);
					String notidescription = "The schedule for Assignment '" + assignment.getTitle()
							+ "' was updated by " + addingUser.getUsername() + " for the batch " + batch.getBatchTitle()
							+ " to " + formattedDate + ".";
					Long NotifyId = notiservice.createNotification("Assignment", addingUser.getUsername(),
							notidescription, addingUser.getUsername(), heading, link);

					List<String> user = new ArrayList<String>();
					for (Muser student : batch.getUsers()) {
						user.add(student.getEmail());
					}
					if (!user.isEmpty()) {
						notiservice.SpecificCreateNotificationusingEmail(NotifyId, user);
					}
					sendmailService(request, "Updated", user, addingUser.getInstitutionName(), formattedDate,
							batch.getBatchTitle(), assignment.getTitle());

					return ResponseEntity.ok("Updated");
				} else {
					schedule = new AssignmentSchedule();
					schedule.setAssignment(assignment);
					schedule.setBatch(batch);
					schedule.setAssignmentDate(AssignmentDate);
					sheduleRepo.save(schedule);
					// notifiction====================================
					String heading = "Assignment Sheduled !";
					String link = "/submitAssignment/" + batch.getId() + "/" + assignment.getId();
					DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
					String formattedDate = AssignmentDate.format(formatter);

					String notidescription = "A new Assignment '" + assignment.getTitle() + "' was Scheduled by "
							+ addingUser.getUsername() + " for the batch " + batch.getBatchTitle() + " on "
							+ formattedDate;

					Long NotifyId = notiservice.createNotification("Assignment", addingUser.getUsername(),
							notidescription, addingUser.getUsername(), heading, link);

					List<String> user = new ArrayList<String>();
					for (Muser student : batch.getUsers()) {
						user.add(student.getEmail());
					}
					if (!user.isEmpty()) {
						notiservice.SpecificCreateNotificationusingEmail(NotifyId, user);
					}

					// ==============================mail sending ===============
					sendmailService(request, "Scheduled", user, addingUser.getInstitutionName(), formattedDate,
							batch.getBatchTitle(), assignment.getTitle());
					return ResponseEntity.ok("Saved");
				}

			} else if ("TRAINER".equals(role)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This Course Was Not Assigned To You");
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Unauthorized");
			}
		} catch (Exception e) {
			logger.error("error at GetSheduleQuizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

		}
	}

	private void sendmailService(HttpServletRequest request, String state, List<String> users, String institutionname,
			String formattedScheduleDate, String batchTitle, String assignmentTitle) {
		try {
			List<String> bcc = null;
			List<String> cc = null;
			String domain = request.getHeader("origin"); // Extracts the domain dynamically

			// Fallback if "Origin" header is not present (e.g., direct backend requests)
			if (domain == null || domain.isEmpty()) {
				domain = request.getScheme() + "://" + request.getServerName();
				if (request.getServerPort() != 80 && request.getServerPort() != 443) {
					domain += ":" + request.getServerPort();
				}
			}
			String signInLink = domain + "/login";

			StringBuilder body = new StringBuilder();
			body.append("<html>").append("<body>").append("<h2>📢  Assignment " + state + " on LearnHub!</h2>")
					.append("<p>Dear Student,</p>")
					.append("<p>We hope you're doing great! A new assignment has been scheduled for your batch <strong>")
					.append(batchTitle).append("</strong> on <strong>").append(formattedScheduleDate)
					.append("</strong>.</p>").append("<p><strong>Assignment Title:</strong> ").append(assignmentTitle)
					.append("</p>")
					.append("<p>This assignment is a part of your course curriculum and is designed to help you strengthen your understanding of the concepts.</p>")
					.append("<p><strong>What you need to do:</strong></p>").append("<ul>")
					.append("<li>Log in to your LearnHub account</li>")
					.append("<li>Navigate to your batch dashboard</li>")
					.append("<li>Find and complete the assignment on or before the deadline</li>").append("</ul>")
					.append("<p>Click the link below to get started:</p>").append("<p><a href='").append(signInLink)
					.append("' style='font-size:16px; color:blue;'>Go to LearnHub</a></p>")
					.append("<p>Stay consistent and keep learning! 🚀</p>")
					.append("<p>Best Regards,<br>LearnHub Team</p>").append("</body>").append("</html>");

			emailService.sendHtmlEmailAsync(institutionname, users, cc, bcc,
					"New Assignment Scheduled - " + assignmentTitle, body.toString());
		} catch (Exception e) {
			// TODO: handle exception
			logger.error("error in Sending mail" + e.getMessage());
		}

	}

	public ResponseEntity<?> UpdateAssignmentQuizzQuestion(Long questionId, AssignmentQuestion quizzquestion,
			String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;
			Optional<AssignmentQuestion> opquest = QuestionRepo.findById(questionId);
			if (opquest.isPresent()) {
				AssignmentQuestion quest = opquest.get();
				if ("ADMIN".equals(role)) {
					isalloted = true;
				} else if ("TRAINER".equals(role)) {
					Long courseID = quest.getAssignment().getCourseDetail().getCourseId();
					isalloted = muserRepo.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
				}
				if (isalloted) {
					quest.setAnswer(quizzquestion.getAnswer());
					quest.setOption1(quizzquestion.getOption1());
					quest.setOption2(quizzquestion.getOption2());
					quest.setOption3(quizzquestion.getOption3());
					quest.setOption4(quizzquestion.getOption4());
					quest.setQuestionText(quizzquestion.getQuestionText());
					QuestionRepo.save(quest);
					return ResponseEntity.ok("updated Successfully");
				}
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you Are Not allowed to access This Page");
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Question Found for the Assignment");
			}

		} catch (Exception e) {
			logger.error("error at Update QuizzQuestion For Assignment" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

}
