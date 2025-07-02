package com.knowledgeVista.Course.Quizz.Service;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Course.videoLessons;
import com.knowledgeVista.Course.Quizz.QuizAttempt;
import com.knowledgeVista.Course.Quizz.QuizAttemptAnswer;
import com.knowledgeVista.Course.Quizz.Quizz;
import com.knowledgeVista.Course.Quizz.QuizzSchedule;
import com.knowledgeVista.Course.Quizz.Quizzquestion;
import com.knowledgeVista.Course.Quizz.ShedueleListDto;
import com.knowledgeVista.Course.Quizz.DTO.AnswerDto;
import com.knowledgeVista.Course.Quizz.DTO.AnswerDto.QuizAnswerResult;
import com.knowledgeVista.Course.Quizz.DTO.QScoreNameIdDto;
import com.knowledgeVista.Course.Quizz.DTO.QuizzHistoryDto;
import com.knowledgeVista.Course.Quizz.DTO.QuizzquestionDTO;
import com.knowledgeVista.Course.Quizz.Repo.QuizzAttemptAnswerRepo;
import com.knowledgeVista.Course.Quizz.Repo.QuizzQuestionRepo;
import com.knowledgeVista.Course.Quizz.Repo.QuizzSheduleRepo;
import com.knowledgeVista.Course.Quizz.Repo.QuizzattemptRepo;
import com.knowledgeVista.Course.Quizz.Repo.quizzRepo;
import com.knowledgeVista.Course.Repository.videoLessonRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class QuizzService {

	private final JwtUtil jwtUtil;
	private final MuserRepositories muserRepository;
	private final QuizzQuestionRepo quizQuestionRepo;
	private final quizzRepo quizzRepo;
	private final videoLessonRepo lessonsRepo;
	private final QuizzSheduleRepo quizzSheuleRepo;
	private final BatchRepository batchRepo;
	private final QuizzattemptRepo quizAttemptRepo;
	private final QuizzAttemptAnswerRepo answerRepo;

	public QuizzService(JwtUtil jwtUtil, MuserRepositories muserRepository, QuizzQuestionRepo quizQuestionRepo,
			quizzRepo quizzRepo, videoLessonRepo lessonsRepo, QuizzSheduleRepo quizzSheuleRepo,
			BatchRepository batchRepo, QuizzattemptRepo quizAttemptRepo, QuizzAttemptAnswerRepo answerRepo) {
		this.jwtUtil = jwtUtil;
		this.muserRepository = muserRepository;
		this.quizQuestionRepo = quizQuestionRepo;
		this.quizzRepo = quizzRepo;
		this.lessonsRepo = lessonsRepo;
		this.quizzSheuleRepo = quizzSheuleRepo;
		this.batchRepo = batchRepo;
		this.quizAttemptRepo = quizAttemptRepo;
		this.answerRepo = answerRepo;
	}

	private static final Logger logger = LoggerFactory.getLogger(QuizzService.class);

	public ResponseEntity<?> SaveQuizz(Long lessonId, Quizz quizzData, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {

				String institution = muserRepository.findinstitutionByEmail(email);
				if (institution == null) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("institution Not Found");
				}
				Optional<videoLessons> less = lessonsRepo.findById(lessonId);
				if (less.isPresent()) {
					if (quizzRepo.existsQuizzByLessonID(lessonId)) {
						return ResponseEntity.status(HttpStatus.CONFLICT).body("Duplicate Quizz Entry");
					}
					videoLessons lesson = less.get();
					quizzData.setInstituionName(institution);
					quizzData.setLessons(lesson);
					Quizz Saved = quizzRepo.save(quizzData);
					List<Quizzquestion> Questions = quizzData.getQuizzquestions();
					for (Quizzquestion ques : Questions) {
						ques.setQuizz(Saved);
						quizQuestionRepo.save(ques);
					}
					Map<String, Object> res = new HashMap<String, Object>();
					res.put("quizzId", Saved.getQuizzId());
					res.put("quizname", Saved.getQuizzName());
					return ResponseEntity.ok(res);
				}
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Lesson Not Found");

			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("You are Not Authorized to Access This Page");
			}

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> AddMoreQuestionInQuizz(Long quizzId, Quizzquestion quizzquestion, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {

				String institution = muserRepository.findinstitutionByEmail(email);
				if (institution == null) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("institution Not Found");
				}
				Optional<Quizz> quizz = quizzRepo.findById(quizzId);
				if (quizz.isPresent()) {
					Quizz savedquizz = quizz.get();
					quizzquestion.setQuizz(savedquizz);
					quizQuestionRepo.save(quizzquestion);
					return ResponseEntity.ok("Saved SuccessFully");
				}
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Quizz Not Found");

			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
						.body("You are Not Authorized to Access This Page");
			}

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> GetQuizz(Long quizzId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Quizz> opquizz = quizzRepo.findById(quizzId);
			if (opquizz.isPresent()) {
				Quizz quizz = opquizz.get();
				if ("ADMIN".equals(role)) {
					quizz.setLessons(null);
					quizz.setSchedules(null);
					quizz.setQuizAttempts(null);
					List<Quizzquestion> questions = quizQuestionRepo.findByQuizzId(quizzId);
					quizz.setQuizzquestions(questions);
					return ResponseEntity.ok(quizz);
				} else {
					Long courseID = quizz.getLessons().getCourseDetail().getCourseId();
					boolean isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
					if (isalloted) {
						quizz.setLessons(null);
						quizz.setSchedules(null);
						quizz.setQuizAttempts(null);
						List<Quizzquestion> questions = quizQuestionRepo.findByQuizzId(quizzId);
						quizz.setQuizzquestions(questions);
						return ResponseEntity.ok(quizz);
					} else {
						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You Cannot Access This Page");
					}
				}
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at Getting Quizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> GetQuizzQuestion(Long questionId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Quizzquestion> opquest = quizQuestionRepo.findById(questionId);
			if (opquest.isPresent()) {
				Quizzquestion quest = opquest.get();
				if ("ADMIN".equals(role)) {
					quest.setQuizz(null);
					return ResponseEntity.ok(quest);
				} else {
					Long courseID = quest.getQuizz().getLessons().getCourseDetail().getCourseId();
					boolean isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
					if (isalloted) {
						quest.setQuizz(null);
						return ResponseEntity.ok(quest);
					} else {
						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You Cannot Access This Page");
					}
				}
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at Getting Quizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> DeleteQuizzQuestion(List<Long> questionIds, Long quizzId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;
			Optional<Quizz> opquest = quizzRepo.findById(quizzId);
			if (opquest.isPresent()) {
				Quizz quizz = opquest.get();
				if ("ADMIN".equals(role)) {
					isalloted = true;
				} else if ("TRAINER".equals(role)) {
					Long courseID = quizz.getLessons().getCourseDetail().getCourseId();
					isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
				}
				if (isalloted) {
					List<Quizzquestion> questions = quizQuestionRepo.findByQuestionIdInAndQuizzQuizzId(questionIds,
							quizzId);
					quizQuestionRepo.deleteAll(questions);
					Long remainingQuestions = quizQuestionRepo.countByQuizzId(quizzId);
					System.out.println(remainingQuestions);
					if (remainingQuestions == 0) {
						quizzSheuleRepo.deleteByquizzID(quizzId);
						quizAttemptRepo.deleteByQuizzId(quizzId);
						quizzRepo.deleteQuizzById(quizzId);

					}
					return ResponseEntity.ok("Delted Successfully");
				}
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you Are Not allowed to access This Page");
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at DELETING Quizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> UpdateQuizzQuestion(Long questionId, Quizzquestion quizzquestion, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;
			Optional<Quizzquestion> opquest = quizQuestionRepo.findById(questionId);
			if (opquest.isPresent()) {
				Quizzquestion quest = opquest.get();
				if ("ADMIN".equals(role)) {
					isalloted = true;
				} else if ("TRAINER".equals(role)) {
					Long courseID = quest.getQuizz().getLessons().getCourseDetail().getCourseId();
					isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
				}
				if (isalloted) {
					quest.setAnswer(quizzquestion.getAnswer());
					quest.setOption1(quizzquestion.getOption1());
					quest.setOption2(quizzquestion.getOption2());
					quest.setOption3(quizzquestion.getOption3());
					quest.setOption4(quizzquestion.getOption4());
					quest.setQuestionText(quizzquestion.getQuestionText());
					quizQuestionRepo.save(quest);
					return ResponseEntity.ok("updated Successfully");
				}
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you Are Not allowed to access This Page");
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at Getting Quizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> UpdateQuizzName(Long QuizzId, String QuizzName, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;
			Optional<Quizz> opquest = quizzRepo.findById(QuizzId);
			if (opquest.isPresent()) {
				Quizz quizz = opquest.get();
				if ("ADMIN".equals(role)) {
					isalloted = true;
				} else if ("TRAINER".equals(role)) {
					Long courseID = quizz.getLessons().getCourseDetail().getCourseId();
					isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
				}
				if (isalloted) {
					quizz.setQuizzName(QuizzName);
					quizzRepo.save(quizz);
					return ResponseEntity.ok("updated Successfully");
				}
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you Are Not allowed to access This Page");
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at updatingDuration" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> UpdateQuizzDuration(Long QuizzId, int durationInMinutes, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;
			Optional<Quizz> opquest = quizzRepo.findById(QuizzId);
			if (opquest.isPresent()) {
				Quizz quizz = opquest.get();
				if ("ADMIN".equals(role)) {
					isalloted = true;
				} else if ("TRAINER".equals(role)) {
					Long courseID = quizz.getLessons().getCourseDetail().getCourseId();
					isalloted = muserRepository.FindAllotedOrNotByUserIdAndCourseId(email, courseID);
				}
				if (isalloted) {
					quizz.setDurationInMinutes(durationInMinutes);
					quizzRepo.save(quizz);
					return ResponseEntity.ok("updated Successfully");
				}
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("you Are Not allowed to access This Page");
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No Quizz Found ");
			}

		} catch (Exception e) {
			logger.error("error at updatingDuration" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getQuizzSheduleDetails(Long courseId, Long batchId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			boolean isalloted = false;

			if ("ADMIN".equals(role)) {
				isalloted = true;
			} else if ("TRAINER".equals(role)) {
				isalloted = muserRepository.FindAllotedOrNotByUserIdAndBatchId(email, batchId);
			}
			if (isalloted) {
				List<ShedueleListDto> shedule = quizzRepo.getQuizzShedulesByCourseIdAndBatchId(courseId, batchId);
				return ResponseEntity.ok(shedule);
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} catch (Exception e) {
			logger.error("error at GetSheduleQuizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

		}
	}

	public ResponseEntity<?> SaveORUpdateSheduleQuizz(Long quizzId, Long batchId, LocalDate QuizzDate, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String insitution = muserRepository.findinstitutionByEmail(email);
			if (insitution == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			boolean isalloted = false;
			Optional<Quizz> opquizz = quizzRepo.findById(quizzId);
			Optional<Batch> opbatch = batchRepo.findBatchByIdAndInstitutionName(batchId, insitution);
			if (!opquizz.isPresent()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Quizz Not Found");
			}
			if (!opbatch.isPresent()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Batch Not Found");
			}
			Quizz quizz = opquizz.get();
			Batch batch = opbatch.get();
			Long courseId = quizz.getLessons().getCourseDetail().getCourseId();
			if ("ADMIN".equals(role)) {
				isalloted = true;
			} else if ("TRAINER".equals(role)) {
				isalloted = muserRepository.FindAllotedOrNotByUserIdAndBatchId(email, batchId);
			}
			if (isalloted) {
				Optional<QuizzSchedule> opQuizzschedule = quizzSheuleRepo.findByQuizzIdAndBatchId(quizzId, batchId);
				if (opQuizzschedule.isPresent()) {
					QuizzSchedule shedule = opQuizzschedule.get();
					shedule.setQuizzDate(QuizzDate);
					quizzSheuleRepo.save(shedule);
					return ResponseEntity.ok("Updated");
				} else {
					QuizzSchedule shedule = new QuizzSchedule();
					shedule.setBatch(batch);
					shedule.setQuiz(quizz);
					shedule.setQuizzDate(QuizzDate);
					quizzSheuleRepo.save(shedule);
					return ResponseEntity.ok("saved");
				}
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} catch (Exception e) {
			logger.error("error at GetSheduleQuizz" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

		}
	}
//===========================================Quizz Question sending=========================================================

	public ResponseEntity<?> startQuizz(String token, Long quizzId, Long batchId) {
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

			Optional<Quizz> opQuizz = quizzRepo.findById(quizzId);
			if (opQuizz.isEmpty()) {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Quiz Not Found.");
			}
			Quizz quizz = opQuizz.get();
			LocalDate sheduledDate = quizzSheuleRepo.getsheduleDate(quizzId, batchId);

			LocalDate now = LocalDate.now();
			if (now.isBefore(sheduledDate)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Quiz has not started yet.");
			}
			if (now.isAfter(sheduledDate)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Quiz has expired.");
			}

			return handleQuizAttempt(user, quizz, quizzId);
		} catch (Exception e) {
			logger.error("Error Getting Quiz Questions", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private ResponseEntity<?> handleQuizAttempt(Muser user, Quizz quizz, Long quizzId) {
		Optional<QuizAttempt> opAttempt = quizAttemptRepo.findbyquizzIdandUserId(user.getUserId(), quizzId);
		LocalDateTime startedat = LocalDateTime.now();

		int duration = quizz.getDurationInMinutes();
		if (opAttempt.isPresent()) {
			QuizAttempt attempt = opAttempt.get();

			if (attempt.getScore() == null) {
				attempt.setStartedAt(startedat);
				quizAttemptRepo.save(attempt);
				return getQuizQuestions(quizzId, user.getInstitutionName(), duration);
			}
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You have already attempted the quiz.");
		}
		// New Attempt
		QuizAttempt newAttempt = new QuizAttempt();
		newAttempt.setAttemptNumber(1);
		newAttempt.setQuiz(quizz);
		newAttempt.setUser(user);
		newAttempt.setStartedAt(startedat);
		quizAttemptRepo.save(newAttempt);
		return getQuizQuestions(quizzId, user.getInstitutionName(), duration);
	}

	private ResponseEntity<?> getQuizQuestions(Long quizzId, String institutionName, int duration) {

		List<QuizzquestionDTO> questions = quizQuestionRepo.findQuestionsByQuizIdAndInstitution(quizzId,
				institutionName);
		Map<String, Object> response = new HashMap<>();
		response.put("duration", duration);
		response.put("questions", questions);

		return ResponseEntity.ok(response);

	}

	public ResponseEntity<?> saveQuizzAnswers(String token, Long quizzId, List<AnswerDto> answers) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Long id = muserRepository.findidByEmail(email);
			Optional<QuizAttempt> opattempt = quizAttemptRepo.findbyquizzIdandUserId(id, quizzId);
			if (opattempt.isEmpty()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Attempt Not Found");
			}
			QuizAttempt attempt = opattempt.get();
			if (attempt.getScore() == null) {
				LocalDateTime now = LocalDateTime.now();
				attempt.setSubmittedAt(now);
				QuizAnswerResult result = saveAnswers(answers, attempt, quizzId);
				// Update attempt with score
				attempt.setScore(result.getScore());
				attempt.setSubmittedAt(LocalDateTime.now());
				quizAttemptRepo.save(attempt);

				return ResponseEntity.ok("Quiz Submitted. Score: " + result.getScore());
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(" Quizz Already Attended");
			}

		} catch (Exception e) {
			logger.error("error At Saving Quizz answers" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private QuizAnswerResult saveAnswers(List<AnswerDto> answers, QuizAttempt attempt, Long quizzId) {
		List<QuizAttemptAnswer> saveAnswers = new ArrayList<>();
		double score = 0.0;
		long totalQuestions = quizQuestionRepo.countByQuizzId(quizzId);
		for (AnswerDto answerDto : answers) {
			Optional<Quizzquestion> opQuestion = quizQuestionRepo.findById(answerDto.getQuestionId());
			if (opQuestion.isPresent()) {
				Quizzquestion question = opQuestion.get();
				boolean isCorrect = answerDto.getSelected().equals(question.getAnswer());
				QuizAttemptAnswer answer = new QuizAttemptAnswer();
				answer.setQuizAttempt(attempt);
				answer.setQuestion(question);
				answer.setSelectedOption(answerDto.getSelected());
				answer.setIsCorrect(isCorrect);
				saveAnswers.add(answer);
				if (isCorrect) {
					score += 1; // Each correct answer adds 1 point
				}
			}
		}
		List<QuizAttemptAnswer> savedAnswers = answerRepo.saveAll(saveAnswers);
		QuizAnswerResult res = new QuizAnswerResult();
		res.setSavedAnswers(savedAnswers);
		double percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0.0;
		res.setScore(percentage);
		return res;
	}

	public ResponseEntity<?> getQuizzHistoryforUserByAdmin(String token, Long batchId, String email, int page,
			int size) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				List<Long> quizzIdlist = muserRepository.findQuizzIdsByUserEmail(email, batchId);
				List<Long> scheduledQuizzIds = quizzRepo.getQuizzIDSheduledByUser(email, quizzIdlist);
				Double quizzPercentage = quizAttemptRepo.getTotalScoreForUser(email, scheduledQuizzIds);

				double totalQuizzPercentage = scheduledQuizzIds.size() * 100;
				double quizPercentage100 = (quizzPercentage != null && totalQuizzPercentage > 0)
						? (quizzPercentage / totalQuizzPercentage) * 100
						: 0.0;
				Pageable pageable = PageRequest.of(page, size); // No sorting here
				Page<QuizzHistoryDto> quizHistory = quizzRepo.getUserQuizzHistoryByEmail(email, quizzIdlist, pageable);
				DecimalFormat df = new DecimalFormat("#.##");
				String formattedPercentage = df.format(quizPercentage100);
				Map<String, Object> response = new HashMap<>();
				response.put("quizz", quizHistory); // Extracting content from Page
				response.put("percentage", formattedPercentage);
				return ResponseEntity.ok(response);
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Users cannot access this Page");
		} catch (Exception e) {
			// TODO: handle exception
			logger.error("error At getQuizzHistory" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getQuizzHistory(String token, Long batchId, int page, int size) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String institutionName = muserRepository.findinstitutionByEmail(email);
			if (institutionName == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized User Institution Not Found");
			}
			if (!"USER".equals(role)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body("only Studennts Can Access This Page");
			}

			List<Long> quizzIdlist = muserRepository.findQuizzIdsByUserEmail(email, batchId);
			List<Long> scheduledQuizzIds = quizzRepo.getQuizzIDSheduledByUser(email, quizzIdlist);
			Double quizzPercentage = quizAttemptRepo.getTotalScoreForUser(email, scheduledQuizzIds);

			double totalQuizzPercentage = scheduledQuizzIds.size() * 100;
			double quizPercentage100 = (quizzPercentage != null && totalQuizzPercentage > 0)
					? (quizzPercentage / totalQuizzPercentage) * 100
					: 0.0;
			Pageable pageable = PageRequest.of(page, size); // No sorting here
			Page<QuizzHistoryDto> quizHistory = quizzRepo.getUserQuizzHistoryByEmail(email, quizzIdlist, pageable);
			DecimalFormat df = new DecimalFormat("#.##");
			String formattedPercentage = df.format(quizPercentage100);
			Map<String, Object> response = new HashMap<>();
			response.put("quizz", quizHistory); // Extracting content from Page
			response.put("percentage", formattedPercentage);

			return ResponseEntity.ok(response);
		} catch (Exception e) {
			// TODO: handle exception
			logger.error("error At getQuizzHistory" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getQuizzAnalysis(String token, Long batchId, String email) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			System.out.println(email + batchId);
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				List<Long> quizzIdlist = muserRepository.findQuizzIdsByUserEmail(email, batchId);
				List<Long> scheduledQuizzIds = quizzRepo.getQuizzIDSheduledByUser(email, quizzIdlist);
				List<QScoreNameIdDto> Scores = quizAttemptRepo.getScoresDtoListForUser(email, scheduledQuizzIds);
				Double quizzPercentage = quizAttemptRepo.getTotalScoreForUser(email, scheduledQuizzIds);
				double totalQuizzPercentage = scheduledQuizzIds.size() * 100;
				double quizPercentage100 = (quizzPercentage != null && totalQuizzPercentage > 0)
						? (quizzPercentage / totalQuizzPercentage) * 100
						: 0.0;
				DecimalFormat df = new DecimalFormat("#.##");
				String formattedPercentage = df.format(quizPercentage100);
				Map<String, Object> response = new HashMap<>();
				response.put("scores", Scores); // Extracting content from Page
				response.put("percentage", formattedPercentage);
				return ResponseEntity.ok(response);
			}
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user cannot access this page");
		} catch (Exception e) {
			// TODO: handle exception
			logger.error("error At getQuizzAnalysis" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}
}
