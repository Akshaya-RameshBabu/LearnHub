package com.knowledgeVista.Batch.Assignment.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.Assignment.Assignment;
import com.knowledgeVista.Batch.Assignment.Assignment.AssignmentType;
import com.knowledgeVista.Batch.Assignment.AssignmentQuestion;
import com.knowledgeVista.Batch.Assignment.Submission;
import com.knowledgeVista.Batch.Assignment.Submission.SubmissionStatus;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentQuesstionRepo;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentRepo;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentSheduleRepo;
import com.knowledgeVista.Batch.Assignment.Repo.SubmissionRepo;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.FileService.VideoFileService;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

import jakarta.servlet.ServletContext;

@Service
public class AssignmentService2 {
	@Autowired
	private AssignmentRepo assignmentRepo;
	@Autowired
	AssignmentQuesstionRepo assignmentQuesstionRepo;
	@Autowired
	private MuserRepositories muserRepo;
	@Autowired
	private BatchRepository batchRepo;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private AssignmentSheduleRepo sheduleRepo;
	@Autowired
	private SubmissionRepo submissionRepo;
	@Autowired
	private VideoFileService fileService;
	@Autowired
	private NotificationService notiservice;
	@Autowired
	private ServletContext servletContext;

	private static final Logger logger = LoggerFactory.getLogger(AssignmentService2.class);

	public ResponseEntity<?> getAssignmentsBybatchId(String token, Long batchId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser user = optionalUser.get();
			String role = user.getRole().getRoleName();
			if ("USER".equals(role)) {
				Optional<Batch> opbatch = batchRepo.findById(batchId);
				if (opbatch.isEmpty()) {
					return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
				}
				Batch batch = opbatch.get();
				if (user.getEnrolledbatch().contains(batch)) {
					List<Map<String, Object>> assignments = assignmentRepo
							.getAssignmentSchedulesByBatchIdAndUserId(batchId, user.getUserId());
					return ResponseEntity.ok(assignments);
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN)
							.body("Access denied: You are not enrolled in this batch.");
				}
			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
						.body("Access denied: Only Users Can Access This Page");
			}
		} catch (Exception e) {
			logger.error("Error occured in Getting Assignment" + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			// TODO: handle exception
		}
	}

	public ResponseEntity<?> GetAssignmentByAssignmentIdForSubmission(String token, Long assignmentId, Long batchId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser user = optionalUser.get();
			if (!"USER".equals(user.getRole().getRoleName())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You Cannot Access This Page");
			}

			Optional<Assignment> opassignment = assignmentRepo.findById(assignmentId);
			if (opassignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");
			}

			Assignment assignment = opassignment.get();
			CourseDetail course = assignment.getCourseDetail();

			if (!course.getUsers().contains(user)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Not Enrolled in the Course");
			}

			// Clean the assignment object
			assignment.setCourseDetail(null);
			assignment.setSchedules(null);
			assignment.setSubmissions(null);
			if (assignment.getQuestions() != null) {
				assignment.getQuestions().forEach(q -> q.setAssignment(null));
			}

			// Fetch existing submission if present
			Optional<Submission> existingSubmission = submissionRepo.findByBatchIdAndAssignmentIdAndUserId(assignmentId,
					user.getUserId(), batchId);

			Map<String, Object> responseMap = new HashMap<>();
			responseMap.put("assignment", assignment);
			if (existingSubmission.isPresent()) {
				Submission submission = existingSubmission.get();
				submission.setBatch(null);
				submission.setAssignment(null);
				submission.setUser(null);
				responseMap.put("existingSubmission", submission);
				if (assignment.getType().equals(AssignmentType.FILE_UPLOAD)) {
					File file = new File(submission.getUploadedFileUrl());
					if (file.exists()) {
						byte[] fileContent = Files.readAllBytes(file.toPath());
						String base64File = Base64.getEncoder().encodeToString(fileContent);
						responseMap.put("fileBase64", base64File);
						responseMap.put("fileMimeType", servletContext.getMimeType(file.getName()));
					}
				}

			} else {
				responseMap.put("existingSubmission", null);
			}
			return ResponseEntity.ok(responseMap);

		} catch (Exception e) {
			logger.error("Error Fetching Assignment", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error Occurred while Fetching Assignment: " + e.getMessage());
		}
	}

	public ResponseEntity<?> SubmitAssignment(String token, Long assignmentId, Long batchId, MultipartFile file,
			String answerjson) {
		try {
// Step 2: Get user from token
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser user = optionalUser.get();

// Step 3: Check role
			if (!"USER".equals(user.getRole().getRoleName())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
						.body("Only users with role USER can submit assignments");
			}

// Step 4: Fetch assignment and batch
			Optional<Assignment> optionalAssignment = assignmentRepo.findById(assignmentId);
			Optional<Batch> optionalBatch = batchRepo.findById(batchId);
			if (optionalAssignment.isEmpty())
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Invalid assignment ID");
			if (optionalBatch.isEmpty())
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");

			Assignment assignment = optionalAssignment.get();
			Batch batch = optionalBatch.get();

// Step 5: Check batch enrollment
			if (!user.getEnrolledbatch().contains(batch)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
						.body("Access Denied: You are not enrolled in this batch");
			}

// Step 6: Get schedule date and check existing submission
			LocalDate scheduleDate = sheduleRepo.findSheduleDateByAssignmentIDAndbatchID(batchId, assignmentId);
			if (scheduleDate == null) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Schedule date not found");
			}

			LocalDate currentDate = LocalDate.now();
			Submission.SubmissionStatus status = currentDate.isAfter(scheduleDate)
					? Submission.SubmissionStatus.LATE_SUBMISSION
					: Submission.SubmissionStatus.SUBMITTED;

			Optional<Submission> existingSubmission = submissionRepo.findByBatchIdAndAssignmentIdAndUserId(assignmentId,
					user.getUserId(), batchId);

			Submission submission = existingSubmission.orElseGet(Submission::new);
			if (existingSubmission.isPresent()) {
				if (submission.getSubmissionStatus() == Submission.SubmissionStatus.VALIDATED) {
					return ResponseEntity.status(HttpStatus.FORBIDDEN)
							.body("Assignment already validated. Cannot update.");
				}
				if (currentDate.isAfter(scheduleDate.plusDays(1))) {
					return ResponseEntity.status(HttpStatus.FORBIDDEN)
							.body("Submission deadline passed. Cannot update.");
				}
			} else {
				submission.setAssignment(assignment);
				submission.setBatch(batch);
				submission.setUser(user);
			}

			submission.setSubmittedAt(LocalDateTime.now());
			submission.setSubmissionStatus(status);

			String responseMessage;

			switch (assignment.getType()) {
			case QA -> {
				Map<Long, String> answers = null;
				if (answerjson != null && !answerjson.isEmpty()) {
					try {
						ObjectMapper mapper = new ObjectMapper();
						answers = mapper.readValue(answerjson, new TypeReference<Map<Long, String>>() {
						});
					} catch (Exception e) {
						return ResponseEntity.badRequest().body("Invalid JSON in 'answers'");
					}
				}
				if (answers == null) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("answers cannot be null");
				}
				submission.setAnswers(answers);
				submission.setGraded(false);
				responseMessage = "Assignment Submitted Successfully";
			}
			case FILE_UPLOAD -> {
				if (file == null || file.isEmpty()) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST)
							.body("File not found. Please upload a valid file.");
				}
				String relativeUrl = fileService.saveAssignmentFile(file, user.getInstitutionName(), batch.getId(),
						assignment.getCourseDetail().getCourseId(), user.getUserId());
				submission.setFileName(Paths.get(relativeUrl).getFileName().toString());
				submission.setUploadedFileUrl(relativeUrl);
				submission.setGraded(false);
				responseMessage = "Assignment Submitted Successfully";
			}
			case QUIZ -> {
				Map<Long, String> answers = null;

				if (answerjson != null && !answerjson.isEmpty()) {
					try {
						ObjectMapper mapper = new ObjectMapper();
						answers = mapper.readValue(answerjson, new TypeReference<Map<Long, String>>() {
						});
					} catch (Exception e) {
						return ResponseEntity.badRequest().body("Invalid JSON in 'answers'");
					}
				}
				if (answers == null) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("answers cannot be null");
				}
				List<AssignmentQuestion> allQuestions = assignmentQuesstionRepo.findByAssignment(assignment);
				int totalCorrect = calculateTotalCorrect(allQuestions, answers);
				submission.setAnswers(answers);
				submission.setGraded(true);
				submission.setSubmissionStatus(Submission.SubmissionStatus.VALIDATED);
				submission.setTotalMarksObtained(totalCorrect);
				responseMessage = "Assignment Submitted Successfully. Marks obtained: " + totalCorrect;
			}
			default -> {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Assignment type not supported");
			}
			}

			submissionRepo.save(submission);
			String heading = "Assignment Submitted !";
			String link = "/Assignment/Validate/" + batch.getBatchTitle() + "/" + batch.getId() + "/" + user.getUserId()
					+ "/" + assignment.getId();
			String notidescription = "The Assignment named " + assignment.getTitle() + " was Submitted By "
					+ user.getUsername() + " for the batch " + batch.getBatchTitle();

			Long NotifyId = notiservice.createNotification("Assignment", user.getUsername(), notidescription,
					user.getUsername(), heading, link);

			List<Long> trainerIds = batch.getTrainers().stream().map(Muser::getUserId).collect(Collectors.toList());

			if (!trainerIds.isEmpty()) {
				notiservice.SpecificCreateNotification(NotifyId, trainerIds);
			}
			return ResponseEntity.ok(responseMessage);

		} catch (Exception e) {
			logger.error("Error Submitting Assignment: " + e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("An error occurred while submitting the assignment");
		}
	}

	private int calculateTotalCorrect(List<AssignmentQuestion> questions, Map<Long, String> answers) {
		return (int) questions.stream().filter(q -> {
			String userAnswer = answers.get(q.getId());
			return userAnswer != null && userAnswer.equals(q.getAnswer());
		}).count();
	}

	public ResponseEntity<?> getAssignmentsBybatchIdForValidation(String token, Long batchId, Long userId) {
		try {
			// 1. Extract email and fetch Adding user (request initiator)
			String addingEmail = jwtUtil.getEmailFromToken(token);
			Muser addingUser = muserRepo.findByEmail(addingEmail).orElse(null);
			if (addingUser == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			String role = addingUser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			// 2. Fetch Student
			Muser student = muserRepo.findById(userId).orElse(null);
			if (student == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Student Not Found");
			}

			// 3. Fetch Batch
			Batch batch = batchRepo.findById(batchId).orElse(null);
			if (batch == null) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
			}

			// 4. Check if Adding user has access to the batch
			if ("TRAINER".equals(addingUser.getRole().getRoleName())) {
				if (!addingUser.getBatches().stream().anyMatch(b -> b.getId().equals(batchId))) {
					return ResponseEntity.status(HttpStatus.FORBIDDEN)
							.body("Access denied: You are not allotted to access this batch.");
				}
			}

			// 5. Check if Student is enrolled in the batch
			if (!student.getEnrolledbatch().stream().anyMatch(b -> b.getId().equals(batchId))) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
						.body("Access denied: Student " + student.getUsername() + " is not enrolled in this batch.");
			}

			// 6. Fetch assignments in a single query
			List<Map<String, Object>> assignments = assignmentRepo.getAssignmentSchedulesByBatchIdAndUserId(batchId,
					userId);

			// 7. Build response
			Map<String, Object> response = Map.of("userName", student.getUsername(), "email", student.getEmail(),
					"userId", student.getUserId(), "assignments", assignments, "batchName", batch.getBatchTitle(),
					"batchId", batch.getId());

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			logger.error("Error occurred while fetching assignments: {}", e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal Server Error");
		}
	}

	public ResponseEntity<?> getAssignmentForValidation(String token, Long assignmentId, Long batchId, Long userId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser addinguser = optionalUser.get();
			String role = addinguser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Save Assignment");
			}
			Optional<Assignment> optionalAssignment = assignmentRepo.findById(assignmentId);
			Optional<Batch> optionalBatch = batchRepo.findById(batchId);

			if (optionalAssignment.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Invalid assignment ID");
			}

			if (optionalBatch.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
			}

			Assignment assignment = optionalAssignment.get();
			Batch batch = optionalBatch.get();
			if ("ADMIN".equals(role) || ("TRAINER".equals(role) && addinguser.getBatches().contains(batch))) {
				assignment.setCourseDetail(null);
				assignment.setSchedules(null);
				assignment.setSubmissions(null);
				if (assignment.getQuestions() != null) {
					assignment.getQuestions().forEach(q -> q.setAssignment(null));
				}

				// Fetch existing submission if present
				Optional<Submission> existingSubmission = submissionRepo
						.findByBatchIdAndAssignmentIdAndUserId(assignmentId, userId, batchId);

				Map<String, Object> responseMap = new HashMap<>();
				responseMap.put("assignment", assignment);
				if (existingSubmission.isPresent()) {
					Submission submission = existingSubmission.get();
					submission.setBatch(null);
					submission.setAssignment(null);
					submission.setUser(null);
					responseMap.put("existingSubmission", submission);
					if (assignment.getType().equals(AssignmentType.FILE_UPLOAD)) {
						File file = new File(submission.getUploadedFileUrl());
						if (file.exists()) {
							byte[] fileContent = Files.readAllBytes(file.toPath());
							String base64File = Base64.getEncoder().encodeToString(fileContent);
							responseMap.put("fileBase64", base64File);
							responseMap.put("fileMimeType", servletContext.getMimeType(file.getName()));
						}
					}
				} else {
					responseMap.put("existingSubmission", null);
				}
				return ResponseEntity.ok(responseMap);

			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("you cannot access this page");
			}
		} catch (Exception e) {
			logger.error("Error Validating Assignment: " + e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("An error occurred while gettting the assignment for validation");
		}
	}

	public ResponseEntity<?> ValidateAssignment(String token, Long assignmentId, Long batchId, Long userId,
			String feedback, Integer Marks) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> optionalUser = muserRepo.findByEmail(email);
			if (optionalUser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}
			Muser addinguser = optionalUser.get();
			String role = addinguser.getRole().getRoleName();
			if (!role.equals("ADMIN") && !role.equals("TRAINER")) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Students Cannot Validate Assignment");
			}
			Optional<Batch> optionalBatch = batchRepo.findById(batchId);
			if (optionalBatch.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
			}
			Batch batch = optionalBatch.get();
			if ("ADMIN".equals(role) || ("TRAINER".equals(role) && addinguser.getBatches().contains(batch))) {
				// Fetch existing submission if present
				Optional<Submission> existingSubmission = submissionRepo
						.findByBatchIdAndAssignmentIdAndUserId(assignmentId, userId, batchId);
				if (existingSubmission.isPresent()) {
					Submission submission = existingSubmission.get();
					submission.setFeedback(feedback);
					submission.setGraded(true);
					submission.setSubmissionStatus(SubmissionStatus.VALIDATED);
					submission.setTotalMarksObtained(Marks);
					submissionRepo.save(submission);

					String heading = "Assignment Validated !";
					String link = "/submitAssignment/" + batch.getId() + "/" + submission.getAssignment().getId();
					String notidescription = "The Assignment named " + submission.getAssignment().getTitle()
							+ " was Validated By " + addinguser.getUsername() + " for the batch "
							+ batch.getBatchTitle();

					Long NotifyId = notiservice.createNotification("Assignment", addinguser.getUsername(),
							notidescription, addinguser.getUsername(), heading, link);

					List<String> user = new ArrayList<String>();
					user.add(submission.getUser().getEmail());
					if (!user.isEmpty()) {
						notiservice.SpecificCreateNotificationusingEmail(NotifyId, user);
					}
					return ResponseEntity.ok("Assignment Validated");
				} else {
					return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Submission Not Found");
				}

			} else {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("you cannot access this page");
			}
		} catch (Exception e) {
			logger.error("Error Validating Assignment: " + e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("An error occurred while valiidating Assignment");
		}
	}

	public ResponseEntity<?> DeleteAssignmentQuizzQuestion(List<Long> questionIds, Long AssignmentId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;
			Optional<Assignment> opassignment = assignmentRepo.findById(AssignmentId);
			if (opassignment.isPresent()) {
				Assignment assignment = opassignment.get();
				if ("ADMIN".equals(role)) {
					isalloted = true;
				} else if ("TRAINER".equals(role)) {
					Long courseID = assignment.getCourseDetail().getCourseId();
					isalloted = muserRepo.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
				}
				if (isalloted) {
					List<AssignmentQuestion> questions = assignmentQuesstionRepo.findAllById(questionIds);
					assignmentQuesstionRepo.deleteAll(questions);
					Integer remainingQuestions = assignmentQuesstionRepo.countByAssignmentId(AssignmentId);
					if (remainingQuestions == 0) {
						assignmentRepo.delete(assignment);

					}
					assignment.setTotalMarks(remainingQuestions);
					assignmentRepo.save(assignment);
					return ResponseEntity.ok("Delted Successfully");
				}
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you Are Not allowed to access This Page");
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at DELETING Quizz QuestionOf Assignment" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> AddMoreQuestionForQuizzInAssignment(Long assignmentId, AssignmentQuestion question,
			String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				boolean isalloted = false;
				Optional<Assignment> opAssignment = assignmentRepo.findById(assignmentId);
				if (opAssignment.isPresent()) {
					Assignment assignment = opAssignment.get();

					if ("ADMIN".equals(role)) {
						isalloted = true;
					} else if ("TRAINER".equals(role)) {
						Long courseID = assignment.getCourseDetail().getCourseId();
						isalloted = muserRepo.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
					}
					if (isalloted) {
						question.setAssignment(assignment);
						assignment.setType(AssignmentType.QUIZ);
						assignment.getQuestions().add(question);
						assignment.setTotalMarks(assignment.getTotalMarks() + 1);
						assignmentRepo.save(assignment);
						return ResponseEntity.ok("Saved SuccessFully");
					}
				}

				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Assignment Not Found");

			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("You are Not Authorized to Access This Page");
			}

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

}
