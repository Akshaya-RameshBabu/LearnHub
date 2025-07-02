package com.knowledgeVista.Batch.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Attendance.AttendanceService;
import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.GradeDto;
import com.knowledgeVista.Batch.GradeDto.GradeDtoWithUserDetails;
import com.knowledgeVista.Batch.Assignment.Assignment;
import com.knowledgeVista.Batch.Assignment.AssignmentSchedule;
import com.knowledgeVista.Batch.Assignment.Submission;
import com.knowledgeVista.Batch.Assignment.Repo.AssignmentSheduleRepo;
import com.knowledgeVista.Batch.Assignment.Repo.SubmissionRepo;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Batch.Weightage.Weightage;
import com.knowledgeVista.Batch.Weightage.service.weightageService;
import com.knowledgeVista.Course.Quizz.Repo.QuizzattemptRepo;
import com.knowledgeVista.Course.Quizz.Repo.quizzRepo;
import com.knowledgeVista.Course.Test.Repository.MusertestactivityRepo;
import com.knowledgeVista.Course.moduleTest.MTSheduleListDto.UserResult;
import com.knowledgeVista.Payments.repos.OrderuserRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class GradeService {

	private final JwtUtil jwtUtil;
	private final MuserRepositories muserRepo;
	private final AttendanceService attendanceService;
	private final MusertestactivityRepo testActivityRepo;
	private final QuizzattemptRepo quizzattemptRepo;
	private final weightageService weightageService;
	private final BatchRepository batchRepo;
	private final OrderuserRepo orderuserRepo;
	@Autowired
	private SubmissionRepo submissionRepository;
	@Autowired
	private quizzRepo quizRepo;
	@Autowired
	private AssignmentSheduleRepo assignmentScheduleRepository;
	private static final Logger logger = LoggerFactory.getLogger(GradeService.class);

	// Constructor-based dependency injection
	public GradeService(JwtUtil jwtUtil, MuserRepositories muserRepo, AttendanceService attendanceService,
			MusertestactivityRepo testActivityRepo, QuizzattemptRepo quizzattemptRepo,
			weightageService weightageService, BatchRepository batchRepo, OrderuserRepo orderuserRepo) {
		this.jwtUtil = jwtUtil;
		this.muserRepo = muserRepo;
		this.attendanceService = attendanceService;
		this.testActivityRepo = testActivityRepo;
		this.quizzattemptRepo = quizzattemptRepo;
		this.weightageService = weightageService;
		this.batchRepo = batchRepo;
		this.orderuserRepo = orderuserRepo;
	}

	private GradeDto getGradesbyBatchId(Muser user, Weightage weightage, Long batchId, String batchName) {

		String email = user.getEmail();
		// Quiz Score
		// Calculation========================================================
		List<Long> quizzIdList = muserRepo.findQuizzIdsByUserEmail(email, batchId);
		List<Long> scheduledQuizzIds = quizRepo.getQuizzIDSheduledByUser(email, quizzIdList);
		Double quizzPercentage = quizzattemptRepo.getTotalScoreForUser(user.getUserId(), scheduledQuizzIds);

		double totalQuizzPercentage = scheduledQuizzIds.size() * 100;
		double quizPercentage100 = (quizzPercentage != null && totalQuizzPercentage > 0)
				? (quizzPercentage / totalQuizzPercentage) * 100
				: 0.0;
		double weightedQuiz = round((quizPercentage100 * weightage.getQuizzWeightage()) / 100);

		// Test Score
		// Calculation==============================================================
		List<Long> testIds = muserRepo.findTestIdsByUserEmail(email, batchId);
		List<Long> mtestIds = muserRepo.findMTestIdsByUserEmail(email, batchId);
		int count = testIds.size() + mtestIds.size();
		Double totalPercentage = testActivityRepo.getPercentageForUser(email, testIds, mtestIds, count);

		double weightedTest = round((totalPercentage * weightage.getTestWeightage()) / 100);

		// Attendance Score
		// Calculation======================================================
		Double attendancePercentage = attendanceService.calculateAttendance(user.getUserId(), batchId);
		attendancePercentage = (attendancePercentage != null) ? attendancePercentage : 0.0;
		double weightedAttendance = round((attendancePercentage * weightage.getAttendanceWeightage()) / 100);
		// Assignment=======================================
		double WeightedAssignment = calculateAssignment(user.getUserId(), batchId, weightage.getAssignmentWeightage());
		// Total Score
		// Calculation===================================================================

		double totalScore = round(weightedTest + weightedQuiz + weightedAttendance + WeightedAssignment);

		String res = totalScore >= weightage.getPassPercentage() ? "PASS" : "FAIL";
		GradeDto gradeDto = new GradeDto(batchName, weightedTest, weightedQuiz, weightedAttendance, totalScore,
				WeightedAssignment, res);
		return gradeDto;
	}

	private GradeDto getGradesbyBatchId(Muser user, Weightage weightage, Long batchId, String batchName,
			double totalPercentage) {

		String email = user.getEmail();
		// Quiz Score
		// Calculation========================================================
		List<Long> quizzIdList = muserRepo.findQuizzIdsByUserEmail(email, batchId);
		List<Long> scheduledQuizzIds = quizRepo.getQuizzIDSheduledByUser(email, quizzIdList);
		Double quizzPercentage = quizzattemptRepo.getTotalScoreForUser(user.getUserId(), scheduledQuizzIds);

		double totalQuizzPercentage = scheduledQuizzIds.size() * 100;
		double quizPercentage100 = (quizzPercentage != null && totalQuizzPercentage > 0)
				? (quizzPercentage / totalQuizzPercentage) * 100
				: 0.0;
		double weightedQuiz = round((quizPercentage100 * weightage.getQuizzWeightage()) / 100);

		// Test Score
		// Calculation==============================================================

		double weightedTest = round((totalPercentage * weightage.getTestWeightage()) / 100);

		// Attendance Score
		// Calculation======================================================
		Double attendancePercentage = attendanceService.calculateAttendance(user.getUserId(), batchId);
		attendancePercentage = (attendancePercentage != null) ? attendancePercentage : 0.0;
		double weightedAttendance = round((attendancePercentage * weightage.getAttendanceWeightage()) / 100);
		// AssignmentScore============================
		double WeightedAssignment = calculateAssignment(user.getUserId(), batchId, weightage.getAssignmentWeightage());
		System.out.println("Ass=============" + WeightedAssignment);
		// Total Score
		// Calculation===================================================================

		double totalScore = round(weightedTest + weightedQuiz + weightedAttendance + WeightedAssignment);

		String res = totalScore >= weightage.getPassPercentage() ? "PASS" : "FAIL";
		GradeDto gradeDto = new GradeDto(batchName, weightedTest, weightedQuiz, weightedAttendance, totalScore,
				WeightedAssignment, res);
		return gradeDto;
	}

	public ResponseEntity<?> getTestAndGradeAnalysis(String token, String stuemail, Long batchId) {
		try {
			List<Long> testIds = muserRepo.findTestIdsByUserEmail(stuemail, batchId);
			List<Long> mtestIds = muserRepo.findMTestIdsByUserEmail(stuemail, batchId);
			int count = testIds.size() + mtestIds.size();
			Double totalPercentage = testActivityRepo.getPercentageForUser(stuemail, testIds, mtestIds, count);
			Optional<Muser> opuser = muserRepo.findByEmail(stuemail);
			if (opuser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser user = opuser.get();
			if (!"USER".equals(user.getRole().getRoleName())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Students Can Access This Page");
			}
			Weightage weightage = weightageService.getWeightage(user.getInstitutionName());

			GradeDto grade = getGradesbyBatchId(user, weightage, batchId, "default NAME", totalPercentage);
			Map<String, Object> res = new HashMap<>();
			res.put("grade", grade.getTotalScore());
			res.put("result", grade.getResult());
			res.put("assignment", grade.getWeightedAssignment());
			res.put("test", totalPercentage);
			return ResponseEntity.ok(res);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getGrades(String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepo.findByEmail(email);
			if (opuser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser user = opuser.get();
			if (!"USER".equals(user.getRole().getRoleName())) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Students Can Access This Page");
			}
			Weightage weightage = weightageService.getWeightage(user.getInstitutionName());
			List<GradeDto> grades = new ArrayList<GradeDto>();
			List<Batch> batches = user.getEnrolledbatch();
			for (Batch batch : batches) {
				GradeDto grade = getGradesbyBatchId(user, weightage, batch.getId(), batch.getBatchTitle());
				grade.setBatchImage(batch.getBatchImage());
				grades.add(grade);
			}
			Map<String, Object> res = new HashMap<>();
			res.put("grades", grades);
			res.put("weight", weightage);
			return ResponseEntity.ok(res);

		} catch (NullPointerException e) {
			logger.error("NullPointerException while fetching grades", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Some required data is missing");
		} catch (ArithmeticException e) {
			logger.error("ArithmeticException while calculating grades", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Math error occurred during calculation");
		} catch (Exception e) {
			logger.error("Error Fetching Grade Points", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error occurred");
		}
	}

	public ResponseEntity<?> getGradesofStudent(String token, String email, Long batchId) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			Optional<Muser> opuser = muserRepo.findByEmail(email);
			if (opuser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser user = opuser.get();
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Weightage weightage = weightageService.getWeightage(user.getInstitutionName());

				// Use stream to find the batch
				Optional<Batch> matchingBatch = user.getEnrolledbatch().stream()
						.filter(batch -> batch.getId().equals(batchId)).findFirst();

				if (matchingBatch.isPresent()) {
					GradeDto grade = getGradesbyBatchId(user, weightage, matchingBatch.get().getId(),
							matchingBatch.get().getBatchTitle());
					GradeDtoWithUserDetails finalgrade = new GradeDtoWithUserDetails();
					finalgrade.setGradeDto(grade);
					finalgrade.setProfile(user.getProfile());
					finalgrade.setEmail(user.getEmail());
					finalgrade.setUserName(user.getUsername());
					Map<String, Object> res = new HashMap<>();
					res.put("grades", finalgrade);
					res.put("weight", weightage);
					return ResponseEntity.ok(res);
				} else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Batch not found");
				}
			}

			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Students cannot access this page");

		} catch (NullPointerException e) {
			logger.error("NullPointerException while fetching grades", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Some required data is missing");
		} catch (ArithmeticException e) {
			logger.error("ArithmeticException while calculating grades", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Math error occurred during calculation");
		} catch (Exception e) {
			logger.error("Error Fetching Grade Points", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error occurred");
		}
	}

// Helper method to round to 2 decimal places
	private double round(double value) {
		return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
	}

	public ResponseEntity<?> getBatchAnalysis(Long batchId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String institutionName = muserRepo.findinstitutionByEmail(email);
			if (institutionName == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized User Institution Not Found");
			}
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Map<String, Object> response = getResult(batchId, institutionName);
				return ResponseEntity.ok(response);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Students Cannot Access This page");
			}
		} catch (Exception e) {
			// TODO: handle exception
			logger.error("error occured in Getting courseOF batch " + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public Map<String, Object> getResult(Long batchId, String institutionName) {
		Weightage weightage = weightageService.getWeightage(institutionName);
		Optional<Batch> opbatch = batchRepo.findById(batchId);
		int passCount = 0;
		int failCount = 0;
		int userCount = 0;
		Long seats = 0L;
		Double totalAttendance = 0.0;
		Long revenue = orderuserRepo.getTotalAmountReceivedByBatchId(batchId);
		if (opbatch.isPresent()) {
			Batch batch = opbatch.get();
			seats = batch.getNoOfSeats();
			List<Muser> users = batch.getUsers();
			userCount = users.size();
			for (Muser singleuser : users) {
				UserResult res = getpassOrFail(singleuser, weightage, batchId);
				if (res.getPassFailStatus().equals("PASS")) { // Corrected string comparison
					passCount++;
				} else {
					failCount++;
				}
				totalAttendance += res.getAttendancePercentage();
			}
		}
		double overallAttendance = (userCount > 0) ? round(totalAttendance / userCount) : 0.0;
		double overAllNotAttendance = 100 - overallAttendance;
		Map<String, Object> response = new HashMap<>(); // Corrected Map type
		response.put("PASS", passCount);
		response.put("FAIL", failCount);
		response.put("TOTAL", userCount);
		response.put("PRESENT", overallAttendance);
		response.put("REVENUE", revenue);
		response.put("STUDENTS", userCount);
		response.put("SEATS", seats);
		response.put("ABSENT", overAllNotAttendance);

		return response; // Added return statement
	}

	private UserResult getpassOrFail(Muser user, Weightage weightage, Long batchId) {

		String email = user.getEmail();
		// Quiz Score
		// Calculation========================================================
		List<Long> quizzIdList = muserRepo.findQuizzIdsByUserEmail(email, batchId);
		List<Long> scheduledQuizzIds = quizRepo.getQuizzIDSheduledByUser(email, quizzIdList);
		Double quizzPercentage = quizzattemptRepo.getTotalScoreForUser(user.getUserId(), scheduledQuizzIds);

		double totalQuizzPercentage = scheduledQuizzIds.size() * 100;
		double quizPercentage100 = (quizzPercentage != null && totalQuizzPercentage > 0)
				? (quizzPercentage / totalQuizzPercentage) * 100
				: 0.0;
		double weightedQuiz = round((quizPercentage100 * weightage.getQuizzWeightage()) / 100);

		// Test Score
		// Calculation==============================================================
		List<Long> testIds = muserRepo.findTestIdsByUserEmail(email, batchId);
		List<Long> mtestIds = muserRepo.findMTestIdsByUserEmail(email, batchId);
		int count = testIds.size() + mtestIds.size();
		Double totalPercentage = testActivityRepo.getPercentageForUser(email, testIds, mtestIds, count);
		double weightedTest = round((totalPercentage * weightage.getTestWeightage()) / 100);

		// Attendance Score
		// Calculation======================================================
		Double attendancePercentage = attendanceService.calculateAttendance(user.getUserId(), batchId);
		attendancePercentage = (attendancePercentage != null) ? attendancePercentage : 0.0;
		double weightedAttendance = round((attendancePercentage * weightage.getAttendanceWeightage()) / 100);
		// Assignment Score========================================================
		double WeightedAssignment = calculateAssignment(user.getUserId(), batchId, weightage.getAssignmentWeightage());
		// Total Score
		// Calculation===================================================================
		double totalScore = round(weightedTest + weightedQuiz + weightedAttendance + WeightedAssignment);

		String res = totalScore >= weightage.getPassPercentage() ? "PASS" : "FAIL";
		return new UserResult(res, attendancePercentage);
	}

	private double calculateAssignment(Long userId, Long batchId, Integer AssignmentWeightage) {
		List<AssignmentSchedule> schedules = assignmentScheduleRepository.findByBatchId(batchId);
		int totalPossibleMarks = 0;
		int totalObtainedMarks = 0;
		for (AssignmentSchedule schedule : schedules) {
			Assignment assignment = schedule.getAssignment();
			totalPossibleMarks += assignment.getTotalMarks() != null ? assignment.getTotalMarks() : 0;
			Optional<Submission> opsubmission = submissionRepository
					.findByBatchIdAndAssignmentIdAndUserId(assignment.getId(), userId, batchId);
			if (opsubmission.isPresent()) {
				Submission submission = opsubmission.get();
				totalObtainedMarks += submission.getTotalMarksObtained() != null ? submission.getTotalMarksObtained()
						: 0;
			}
		}
		if (totalPossibleMarks == 0)
			return 0.0;
		double score = (totalObtainedMarks * AssignmentWeightage) / (double) totalPossibleMarks;
		return Math.round(score * 100.0) / 100.0; // Rounded to 2 decimal places
	}

}
