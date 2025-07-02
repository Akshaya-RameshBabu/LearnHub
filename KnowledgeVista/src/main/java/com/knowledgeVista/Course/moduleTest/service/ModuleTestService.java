package com.knowledgeVista.Course.moduleTest.service;

import java.time.LocalDate;
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

import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.VideoLessonDTO;
import com.knowledgeVista.Course.videoLessons;
import com.knowledgeVista.Course.Quizz.DTO.AnswerDto;
import com.knowledgeVista.Course.Quizz.DTO.AnswerDto.ModuleTestAnswerResult;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Course.Repository.videoLessonRepo;
import com.knowledgeVista.Course.moduleTest.MQuestion;
import com.knowledgeVista.Course.moduleTest.MTSheduleListDto;
import com.knowledgeVista.Course.moduleTest.ModuleTest;
import com.knowledgeVista.Course.moduleTest.ModuleTestActivity;
import com.knowledgeVista.Course.moduleTest.ModuleTestAnswer;
import com.knowledgeVista.Course.moduleTest.SheduleModuleTest;
import com.knowledgeVista.Course.moduleTest.repo.MQuestionRepo;
import com.knowledgeVista.Course.moduleTest.repo.ModuleTestActivityRepo;
import com.knowledgeVista.Course.moduleTest.repo.ModuleTestAnswerRepo;
import com.knowledgeVista.Course.moduleTest.repo.SheduleModuleTestRepo;
import com.knowledgeVista.Course.moduleTest.repo.moduleTestRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class ModuleTestService {
	@Autowired
	private MuserRepositories muserRepository;
	@Autowired
	private CourseDetailRepository coursedetailrepository;
	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private videoLessonRepo lessonRepo;
	@Autowired
	private moduleTestRepo moduletestRepo;
	@Autowired
	private MQuestionRepo MquestionRepo;
	@Autowired
	private ModuleTestActivityRepo moduletestActivityrepo;
	@Autowired
	private BatchRepository batchRepo;
	@Autowired
	private ModuleTestAnswerRepo moduleTestAnswerRepo;
	@Autowired
	private SheduleModuleTestRepo sheduleTestRepo;

	private static final Logger logger = LoggerFactory.getLogger(ModuleTestService.class);

	public ResponseEntity<?> searchLessons(String token, String Query, Long courseId) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String institution = muserRepository.findinstitutionByEmail(email);
			if (institution == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Institution Not Found");
			}
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				List<VideoLessonDTO> lessons = lessonRepo.searchByTitle(Query, institution, courseId);
				return ResponseEntity.ok(lessons);
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User cannot Access This Page");
		} catch (Exception e) {
			logger.error("error at searchLesson" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> SaveModuleTest(String token, List<Long> lessonIds, ModuleTest moduleTest, Long courseId) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String institution = muserRepository.findinstitutionByEmail(email);

			if (institution == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Institution Not Found");
			}

			// Check if user has permission
			if (!"ADMIN".equals(role) && !"TRAINER".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User cannot access this page");
			}

			// Fetch lessons and course details
			List<videoLessons> lessons = lessonRepo.findByLessonIdsAndInstitutionName(lessonIds, institution);

			Optional<CourseDetail> courseOpt = coursedetailrepository.findByCourseIdAndInstitutionName(courseId,
					institution);
			if (courseOpt.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Course not found");
			}
			CourseDetail course = courseOpt.get();
			// Associate module test with course and lessons
			moduleTest.setCourseDetail(course);
			moduleTest.setLessons(lessons);
			moduleTest.getQuestions().forEach(q -> q.setMtest(moduleTest));
			// Save module test and questions in a single transaction
			System.out.println("size");
			moduleTest.setMnoOfQuestions(Long.valueOf(moduleTest.getQuestions().size()));
			ModuleTest savedModuleTest = moduletestRepo.save(moduleTest);
			System.out.println(savedModuleTest.getMtestName());
			moduleTest.getQuestions().forEach(q -> q.setMtest(savedModuleTest));
			MquestionRepo.saveAll(moduleTest.getQuestions());

			return ResponseEntity.ok("Module test saved successfully");

		} catch (Exception e) {
			logger.error("Error in SaveModuleTest: ", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
		}
	}

	public ResponseEntity<?> getModuleTestById(Long mtestId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if (!"ADMIN".equals(role) && !"TRAINER".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User cannot access this page");
			}
			Optional<ModuleTest> optest = moduletestRepo.findModuleTestWithoutRelations(mtestId);
			if (optest.isPresent()) {
				ModuleTest test = optest.get();
				List<MQuestion> questions = MquestionRepo.findByModuleTestId(test.getMtestId());
				test.setQuestions(questions);
				return ResponseEntity.ok(test);
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT)
						.body("Module Test with Given Id " + mtestId + " is not  Found");
			}

		} catch (Exception e) {
			logger.error("Error At get Module test by Id" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getModuleTestListByCourseId(Long courseId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if (!"ADMIN".equals(role) && !"TRAINER".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User cannot access this page");
			}
			List<ModuleTest> test = moduletestRepo.findModuleTestListWithoutRelations(courseId);

			return ResponseEntity.ok(test);

		} catch (Exception e) {
			logger.error("Error At get Module test by courseId" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> addMoreModuleQuestion(Long mtestId, String questionText, String option1, String option2,
			String option3, String option4, String answer, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if (!"ADMIN".equals(role) && !"TRAINER".equals(role)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Access denied");
			}

// Fetch ModuleTest by ID
			return moduletestRepo.findById(mtestId).map(test -> {
				test.setMnoOfQuestions(test.getMnoOfQuestions() + 1);

// Create and save new question
				MQuestion ques = new MQuestion(questionText, option1, option2, option3, option4, answer, test);
				MquestionRepo.save(ques);

				return ResponseEntity.ok("Question added successfully");
			}).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Test not found"));

		} catch (Exception e) {
			logger.error("Error adding question: ", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred: " + e.getMessage());
		}
	}

	public ResponseEntity<?> deleteModuleQuestion(List<Long> questionIds, String token, Long testId) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			int deletedQuestionsCount = 0;

			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				for (Long id : questionIds) {
					if (MquestionRepo.existsById(id)) { // Check if the question exists before deleting
						MquestionRepo.deleteById(id);
						deletedQuestionsCount++;
					}
				}

				Optional<ModuleTest> optTest = moduletestRepo.findById(testId);
				if (optTest.isPresent()) {
					ModuleTest test = optTest.get();
					Long noOfQuestions = test.getMnoOfQuestions();

					noOfQuestions -= deletedQuestionsCount;

					if (noOfQuestions <= 0) {
						moduletestRepo.deleteById(testId); // Delete test if no questions are left
					} else {
						test.setMnoOfQuestions(noOfQuestions);
						moduletestRepo.save(test); // Update test question count
					}
				}

				return ResponseEntity.ok("Questions deleted successfully");
			}

			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
		} catch (Exception e) {
			logger.error("Error deleting questions", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		}
	}

	public ResponseEntity<?> editModuleTest(Long testId, String testName, Long noOfAttempt, Double passPercentage,
			String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Optional<ModuleTest> optest = moduletestRepo.findById(testId);
				System.out.println("test" + testName);
				System.out.println("pass" + passPercentage);
				System.out.println("noofat" + noOfAttempt);
				if (optest.isPresent()) {
					ModuleTest test = optest.get();
					if (testName != null) {
						test.setMtestName(testName);
					}
					if (noOfAttempt != null) {
						test.setMnoOfAttempt(noOfAttempt);
					}
					if (passPercentage != null) {
						test.setMpassPercentage(passPercentage);
					}
					moduletestRepo.saveAndFlush(test);
					return ResponseEntity.ok().body("Module Test updated successfully");

				} else {
					return ResponseEntity.status(HttpStatus.NO_CONTENT).body("test Not Found");
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error updating Module test: " + e.getMessage());
		}
	}

	public ResponseEntity<?> getModuleQuestion(Long questionId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				MQuestion existingQuestion = MquestionRepo.findById(questionId).orElse(null);

				existingQuestion.setMtest(null);
				return ResponseEntity.ok(existingQuestion);
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Users Canot Access This Page");

		} catch (Exception e) {
			// Handle any unexpected exceptions here
			// You can log the error or return an appropriate response
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		}

	}

	public ResponseEntity<?> updateModuleQuestion(Long questionId, String questionText, String option1, String option2,
			String option3, String option4, String answer, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Optional<MQuestion> opexistingQuestion = MquestionRepo.findById(questionId);
				if (opexistingQuestion.isPresent()) {
					MQuestion existingQuestion = opexistingQuestion.get();
					existingQuestion.setQuestionText(questionText);
					existingQuestion.setOption1(option1);
					existingQuestion.setOption2(option2);
					existingQuestion.setOption3(option3);
					existingQuestion.setOption4(option4);
					existingQuestion.setAnswer(answer);
					MquestionRepo.save(existingQuestion);
					return ResponseEntity.ok().body("Question updated successfully");
				}
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Question Not Found");
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {

			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("message" + e.getMessage());
		}
	}

	public ResponseEntity<?> SaveORUpdateSheduleModuleTest(Long mtestId, Long batchId, LocalDate testDate,
			String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String insitution = muserRepository.findinstitutionByEmail(email);
			if (insitution == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			boolean isalloted = false;
			Optional<ModuleTest> opmtest = moduletestRepo.findById(mtestId);
			Optional<Batch> opbatch = batchRepo.findBatchByIdAndInstitutionName(batchId, insitution);
			if (!opmtest.isPresent()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("ModuleTest Not Found");
			}
			if (!opbatch.isPresent()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
			}
			ModuleTest mtest = opmtest.get();
			Batch batch = opbatch.get();
			Long courseId = mtest.getCourseDetail().getCourseId();
			if ("ADMIN".equals(role)) {
				isalloted = true;
			} else if ("TRAINER".equals(role)) {
				isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseId);
			}
			if (isalloted) {
				Optional<SheduleModuleTest> opQuizzschedule = sheduleTestRepo.findByModuleTestIdAndBatchId(mtestId,
						batchId);
				if (opQuizzschedule.isPresent()) {
					SheduleModuleTest shedule = opQuizzschedule.get();
					shedule.setTestDate(testDate);
					sheduleTestRepo.save(shedule);
					return ResponseEntity.ok("Updated");
				} else {
					SheduleModuleTest shedule = new SheduleModuleTest();
					shedule.setBatch(batch);
					shedule.setMtest(mtest);
					shedule.setTestDate(testDate);
					sheduleTestRepo.save(shedule);
					return ResponseEntity.ok("saved");
				}
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} catch (Exception e) {
			logger.error("error at SaveOrUpdateSheduleModuleTest" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

		}
	}

	public ResponseEntity<?> getModuleTestSheduleDetails(Long courseId, Long batchId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;

			if ("ADMIN".equals(role)) {
				isalloted = true;
			} else if ("TRAINER".equals(role)) {
				isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseId);
			}
			if (isalloted) {
				List<MTSheduleListDto> shedule = moduletestRepo.getQuizzShedulesByCourseIdAndBatchId(courseId, batchId);
				return ResponseEntity.ok(shedule);
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} catch (Exception e) {
			logger.error("error at getModuleTestShedules " + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

		}
	}

	// ======================================

	public ResponseEntity<?> startModuleTest(String token, Long mtestId, Long batchId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opmuser = muserRepository.findByEmail(email);

			if (opmuser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser user = opmuser.get();
			if (!"USER".equals(user.getRole().getRoleName())) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Only students can attempt the quiz.");
			}

			Batch batch = user.getEnrolledbatch().stream().filter(b -> b.getId().equals(batchId)).findFirst()
					.orElse(null);

			if (batch == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User is not enrolled in this batch.");
			}

			Optional<ModuleTest> opmtest = moduletestRepo.findById(mtestId);
			if (opmtest.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Module Test Not Found.");
			}
			ModuleTest mtest = opmtest.get();
			System.out.println(batchId + "f0" + mtestId);
			LocalDate sheduledDate = sheduleTestRepo.getSheduledDate(mtest.getMtestId(), batchId);
			System.out.println(sheduledDate);

			LocalDate now = LocalDate.now();

			if (now.isBefore(sheduledDate)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Module Test has not started yet.");
			}
			if (now.isAfter(sheduledDate)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Module Test has expired.");
			}
			return getMtestQuestions(mtestId);
		} catch (Exception e) {
			logger.error("Error Getting ModuleTest Question Questions", e);
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private ResponseEntity<?> getMtestQuestions(Long mtestId) {

		List<MQuestion> questions = MquestionRepo.getQuestionsBymtestId(mtestId);
		Map<String, Object> response = new HashMap<>();
		response.put("questions", questions);
		return ResponseEntity.ok(response);

	}

	public ResponseEntity<?> saveModuleTestAnswers(String token, Long mtestId, List<AnswerDto> answers) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opmuser = muserRepository.findByEmail(email);

			if (opmuser.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

			Muser user = opmuser.get();
			Long id = user.getUserId();
			Long count = moduletestActivityrepo.countByUserAndTestId(id, mtestId);
			Optional<ModuleTest> opmtest = moduletestRepo.findById(mtestId);
			if (opmtest.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Module Test Not Found.");
			}
			ModuleTest mtest = opmtest.get();
			ModuleTestActivity attempt = new ModuleTestActivity();
			LocalDate now = LocalDate.now();
			attempt.setTestDate(now);
			attempt.setNthAttempt(count + 1);
			attempt.setMtest(mtest);
			attempt.setUser(user);
			attempt = moduletestActivityrepo.save(attempt);
			ModuleTestAnswerResult result = saveAnswers(answers, attempt, mtestId);
			// Update attempt with score
			attempt.setPercentage(result.getScore());
			moduletestActivityrepo.save(attempt);

			return ResponseEntity.ok("module Test Submitted. Score: " + result.getScore());

		} catch (Exception e) {
			logger.error("error At Saving Module Test answers" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private ModuleTestAnswerResult saveAnswers(List<AnswerDto> answers, ModuleTestActivity attempt, Long quizzId) {
		List<ModuleTestAnswer> saveAnswers = new ArrayList<>();
		double score = 0.0;
		long totalQuestions = MquestionRepo.countBymtestId(quizzId);
		for (AnswerDto answerDto : answers) {
			Optional<MQuestion> opQuestion = MquestionRepo.findById(answerDto.getQuestionId());
			if (opQuestion.isPresent()) {
				MQuestion question = opQuestion.get();
				boolean isCorrect = answerDto.getSelected().equals(question.getAnswer());
				ModuleTestAnswer answer = new ModuleTestAnswer();
				answer.setModuletestActivity(attempt);
				answer.setQuestion(question);
				answer.setSelectedOption(answerDto.getSelected());
				answer.setIsCorrect(isCorrect);
				saveAnswers.add(answer);
				if (isCorrect) {
					score += 1; // Each correct answer adds 1 point
				}
			}
		}
		List<ModuleTestAnswer> savedAnswers = moduleTestAnswerRepo.saveAll(saveAnswers);
		ModuleTestAnswerResult res = new ModuleTestAnswerResult();
		res.setSavedAnswers(savedAnswers);
		double percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0.0;
		res.setScore(percentage);
		return res;
	}

}
