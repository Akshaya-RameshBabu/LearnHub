package com.knowledgeVista;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.Attendance.AttendanceService;
import com.knowledgeVista.Batch.BatchInstallmentdetails;
import com.knowledgeVista.Batch.SearchDto;
import com.knowledgeVista.Batch.Assignment.Assignment;
import com.knowledgeVista.Batch.Assignment.AssignmentQuestion;
import com.knowledgeVista.Batch.Assignment.Service.AssignmentService;
import com.knowledgeVista.Batch.Assignment.Service.AssignmentService2;
import com.knowledgeVista.Batch.Event.EventController;
import com.knowledgeVista.Batch.Weightage.Weightage;
import com.knowledgeVista.Batch.Weightage.service.weightageService;
import com.knowledgeVista.Batch.service.AssignBatch;
import com.knowledgeVista.Batch.service.BatchService;
import com.knowledgeVista.Batch.service.BatchService2;
import com.knowledgeVista.Batch.service.GradeService;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.CourseDetailDto;
import com.knowledgeVista.Course.VideoLessonDTO.SaveModuleTestRequest;
import com.knowledgeVista.Course.Controller.CheckAccess;
import com.knowledgeVista.Course.Controller.CourseController;
import com.knowledgeVista.Course.Controller.CourseControllerSecond;
import com.knowledgeVista.Course.Controller.videolessonController;
import com.knowledgeVista.Course.Quizz.Quizz;
import com.knowledgeVista.Course.Quizz.Quizzquestion;
import com.knowledgeVista.Course.Quizz.DTO.AnswerDto;
import com.knowledgeVista.Course.Quizz.Service.QuizzService;
import com.knowledgeVista.Course.Test.CourseTest;
import com.knowledgeVista.Course.Test.controller.QuestionController;
import com.knowledgeVista.Course.Test.controller.Testcontroller;
import com.knowledgeVista.Course.certificate.certificateController;
import com.knowledgeVista.Course.moduleTest.service.ModuleTestService;
import com.knowledgeVista.Email.EmailController;
import com.knowledgeVista.Email.Mailkeys;
import com.knowledgeVista.License.LicenceControllerSecond;
import com.knowledgeVista.License.LicenseController;
import com.knowledgeVista.Meeting.ZoomAccountKeys;
import com.knowledgeVista.Meeting.ZoomMeetAccountController;
import com.knowledgeVista.Meeting.ZoomMeetingService;
import com.knowledgeVista.Meeting.zoomclass.MeetingRequest;
import com.knowledgeVista.Notification.Controller.NotificationController;
import com.knowledgeVista.Payments.Paymentsettings;
import com.knowledgeVista.Payments.Paypalsettings;
import com.knowledgeVista.Payments.Stripesettings;
import com.knowledgeVista.Payments.controller.BatchPaymentService;
import com.knowledgeVista.Payments.controller.EnablePaymentsController;
import com.knowledgeVista.Payments.controller.PaymentIntegration;
import com.knowledgeVista.Payments.controller.PaymentIntegration2;
import com.knowledgeVista.Payments.controller.PaymentListController;
import com.knowledgeVista.Payments.controller.PaymentSettingsController;
import com.knowledgeVista.Settings.Feedback;
import com.knowledgeVista.Settings.Controller.SettingsController;
import com.knowledgeVista.User.MuserDto;
import com.knowledgeVista.User.Controller.AddUsers;
import com.knowledgeVista.User.Controller.AssignCourse;
import com.knowledgeVista.User.Controller.AuthenticationController;
import com.knowledgeVista.User.Controller.Edituser;
import com.knowledgeVista.User.Controller.GoogleAuthController;
import com.knowledgeVista.User.Controller.Listview;
import com.knowledgeVista.User.Controller.MserRegistrationController;
import com.knowledgeVista.User.LabellingItems.FooterDetails;
import com.knowledgeVista.User.LabellingItems.controller.FooterDetailsController;
import com.knowledgeVista.User.LabellingItems.controller.LadellingitemController;
import com.knowledgeVista.User.SecurityConfiguration.CheckAccessAnnotation;
import com.knowledgeVista.User.Usersettings.RoleDisplayController;
import com.knowledgeVista.User.Usersettings.Role_display_name;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;

@RestController
@CrossOrigin
public class FrontController {
	@Value("${spring.profiles.active}")
	private String activeProfile;
	@Value("${spring.environment}")
	private String environment;
	@Value("${currency}")
	private String currency;
	@Autowired
	private CourseController courseController;

	@Autowired
	private CourseControllerSecond coursesec;

	@Autowired
	private videolessonController videoless;

	@Autowired
	private CheckAccess check;

	@Autowired
	private QuestionController Question;

	@Autowired
	private Testcontroller testcontroller;

	@Autowired
	private PaymentIntegration payment;
	@Autowired
	private BatchPaymentService paymentservice;
	@Autowired
	private PaymentIntegration2 payment2;

	@Autowired(required = false)
	private PaymentListController paylist;

	@Autowired
	private LicenseController licence;

	@Autowired
	private LicenceControllerSecond licencesec;

	@Autowired
	private PaymentSettingsController settings;

	@Autowired
	private EnablePaymentsController enablectrl;
	@Autowired
	private AddUsers adduser;

	@Autowired
	private AssignCourse assign;

	@Autowired
	private AuthenticationController authcontrol;

	@Autowired
	private Edituser edit;

	@Autowired
	private Listview listview;

	@Autowired
	private MserRegistrationController muserreg;

	@Autowired
	private certificateController certi;

	@Autowired
	private NotificationController noticontroller;

	@Autowired
	private ZoomMeetingService zoomMeetingService;

	@Autowired
	private ZoomMeetAccountController zoomaccountconfig;

	@Autowired
	private EmailController emailcontroller;

	@Autowired
	private RoleDisplayController displayctrl;

	@Autowired
	private SettingsController settingcontroller;

	@Autowired
	private GoogleAuthController googleauth;

	@Autowired
	private LogManagement logmanagement;

	@Autowired
	private LadellingitemController labelingctrl;

	@Autowired
	private AttendanceService attendanceService;

	@Autowired
	private EventController eventController;
	@Autowired
	private GradeService gradeService;
	@Autowired
	private AssignBatch assignBatch;

	private static final Logger logger = LoggerFactory.getLogger(FrontController.class);

	@Autowired
	private FooterDetailsController footerctrl;

	@Autowired
	private BatchService batchService;

	@Autowired
	private BatchService2 batchService2;
	@Autowired
	private QuizzService quizzService;

	@Autowired
	private weightageService weightageService;

	@Autowired
	private ModuleTestService ModuleTestService;

	@Autowired
	private AssignmentService assignmentService;

	@Autowired
	private AssignmentService2 assignmentService2;

//-------------------ACTIVE PROFILE------------------
	@GetMapping("/Active/Environment")
	public Map<String, String> getActiveEnvironment() {
		Map<String, String> response = new HashMap<>();
		response.put("environment", environment);
		response.put("currency", currency);
		return response;
	}

//----------------------------COURSECONTROLLER----------------------------

	@GetMapping("/course/countcourse")
	@CheckAccessAnnotation
	public ResponseEntity<?> countCoursefront(@RequestHeader("Authorization") String token) {
		return courseController.countCourse(token);

	}

	@GetMapping("/sysadmin/dashboard")
	@CheckAccessAnnotation
	public ResponseEntity<?> sysAdminDashboard(@RequestHeader("Authorization") String token) {
		return courseController.sysAdminDashboard(token);

	}

	@GetMapping("/sysadmin/dashboard/{institutationName}")
	@CheckAccessAnnotation
	public ResponseEntity<?> sysAdminDashboardByInstitytaion(@PathVariable String institutationName,
			@RequestHeader("Authorization") String token) {
		return courseController.sysAdminDashboardByInstitytaion(token, institutationName);

	}

	@PostMapping("/course/add")
	@CheckAccessAnnotation
	public ResponseEntity<?> addCourse(@RequestParam("courseImage") MultipartFile file,
			@RequestParam("courseName") String courseName, @RequestParam("courseDescription") String description,
			@RequestParam("courseCategory") String category, @RequestParam("Duration") Long Duration,
			@RequestParam("Noofseats") Long Noofseats, @RequestParam("batches") String batches,
			@RequestParam("courseAmount") Long amount, @RequestHeader("Authorization") String token) {
		return courseController.addCourse(file, courseName, description, category, Duration, Noofseats, batches, amount,
				token);
	}

	@Transactional
	@PatchMapping("/course/edit/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateCourse(@PathVariable Long courseId,
			@RequestParam(value = "courseImage", required = false) MultipartFile file,
			@RequestParam(value = "courseName", required = false) String courseName,
			@RequestParam(value = "courseDescription", required = false) String description,
			@RequestParam(value = "courseCategory", required = false) String category,
			@RequestParam(value = "Noofseats", required = false) Long Noofseats,
			@RequestParam(value = "Duration", required = false) Long Duration,
			@RequestParam(value = "courseAmount", required = false) Long amount,
			@RequestHeader("Authorization") String token) {

		return courseController.updateCourse(token, courseId, file, courseName, description, category, Noofseats,
				Duration, amount);

	}

	@GetMapping("/course/get/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<CourseDetail> getCourse(@PathVariable Long courseId,
			@RequestHeader("Authorization") String token) {
		return courseController.getCourse(courseId, token);
	}

	@GetMapping("/course/viewAllVps")
	public ResponseEntity<List<CourseDetailDto>> viewCourseForVps() {
		return courseController.viewCourseVps();
	}

	@GetMapping("/course/viewAll")
	public ResponseEntity<List<CourseDetailDto>> viewCourse(@RequestHeader("Authorization") String token) {
		if (environment == "VPS") {
			return courseController.viewCourseVps();
		} else {
			return courseController.viewCourse(token);
		}
	}

	@GetMapping("/course/getList")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAllCourseInfo(@RequestHeader("Authorization") String token) {
		return courseController.getAllCourseInfo(token);
	}

	@DeleteMapping("/course/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<String> deleteCourse(@PathVariable Long courseId,
			@RequestHeader("Authorization") String token) {
		return courseController.deleteCourse(courseId, token);
	}

	@GetMapping("/course/getLessondetail/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getLessons(@PathVariable Long courseId, @RequestHeader("Authorization") String token) {
		return courseController.getLessons(courseId, token);
	}

	@GetMapping("/course/getLessonlist/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getLessonList(@PathVariable Long courseId, @RequestHeader("Authorization") String token) {
		return courseController.getLessonList(courseId, token);
	}

//----------------------------COURSE CONTROLLER SECOND-----------------------------------
	@GetMapping("/dashboard/storage")
	@CheckAccessAnnotation
	public ResponseEntity<?> getstorageDetails(@RequestHeader("Authorization") String token) {
		return coursesec.getstoragedetails(token);
	}

	@GetMapping("/dashboard/trainerSats")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAllTrainerhandlingUsersAndCourses(@RequestHeader("Authorization") String token) {
		return coursesec.getAllTrainerhandlingUsersAndCourses(token);
	}

	@GetMapping("/dashboard/StudentSats")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAllStudentCourseDetails(@RequestHeader("Authorization") String token) {
		return coursesec.getAllStudentCourseDetails(token);
	}

//----------------------------videolessonController-------------------------------
	@GetMapping("/getDocs/{lessonId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getDocsName(@PathVariable Long lessonId, @RequestHeader("Authorization") String token) {
		return videoless.getDocsName(lessonId, token);
	}

	@GetMapping("/getmini/{lessonId}/{docId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getMiniatureDetails(@PathVariable Long lessonId, @PathVariable Long docId,
			@RequestHeader("Authorization") String token) {
		return videoless.getMiniatureDetails(lessonId, docId, token);
	}

	@PostMapping("/lessons/save/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> savenote(@RequestParam(value = "thumbnail", required = false) MultipartFile file,
			@RequestParam("Lessontitle") String Lessontitle,
			@RequestParam("LessonDescription") String LessonDescription,
			@RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
			@RequestParam(value = "fileUrl", required = false) String fileUrl,
			@RequestParam(value = "documentContent", required = false) List<MultipartFile> documentFiles,
			@PathVariable Long courseId, @RequestHeader("Authorization") String token) {
		return videoless.savenote(file, Lessontitle, LessonDescription, videoFile, fileUrl, documentFiles, courseId,
				token);
	}

	@PatchMapping("/lessons/edit/{lessonId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> EditLessons(@PathVariable Long lessonId,
			@RequestParam(value = "thumbnail", required = false) MultipartFile file,
			@RequestParam(required = false) String Lessontitle,
			@RequestParam(required = false) String LessonDescription,
			@RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
			@RequestParam(value = "newDocumentFiles", required = false) List<MultipartFile> newDocumentFiles,
			@RequestParam(value = "removedDetails", required = false) List<Long> removedDetails,
			@RequestParam(value = "fileUrl", required = false) String fileUrl,
			@RequestHeader("Authorization") String token) {
		return videoless.EditLessons(lessonId, file, Lessontitle, LessonDescription, videoFile, fileUrl,
				newDocumentFiles, removedDetails, token);
	}

	@GetMapping("/slide/{fileName}/{pageNumber}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getDocFile(@PathVariable String fileName, @PathVariable int pageNumber,
			@RequestHeader("Authorization") String token) {
		return videoless.getDocFile(fileName, pageNumber, token);
	}

	@GetMapping("/lessons/getvideoByid/{lessId}/{courseId}/{token}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getVideoFile(@PathVariable Long lessId, @PathVariable Long courseId,
			@PathVariable String token, HttpServletRequest request) {

		return videoless.getVideoFile(lessId, courseId, token, request);
	}

	@GetMapping("/lessons/getLessonsByid/{lessonId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getlessonfromId(@PathVariable("lessonId") Long lessonId,
			@RequestHeader("Authorization") String token) {
		return videoless.getlessonfromId(lessonId, token);
	}

	@DeleteMapping("/lessons/delete")
	@CheckAccessAnnotation
	public ResponseEntity<?> deleteLessonsByLessonId(@RequestParam("lessonId") Long lessonId,
			@RequestParam("Lessontitle") String Lessontitle, @RequestHeader("Authorization") String token) {
		return videoless.deleteLessonsByLessonId(lessonId, Lessontitle, token);
	}

	// -------------------------CheckAccess -------------------------------------
	@PostMapping("/CheckAccess/match")
	@CheckAccessAnnotation
	public ResponseEntity<?> checkAccess(@RequestBody Map<String, Long> requestData,
			@RequestHeader("Authorization") String token) {

		return check.checkAccess(requestData, token);
	}
//---------------------------QuestionController-----------------------

	@PostMapping("/test/calculateMarks/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> calculateMarks(@RequestBody List<Map<String, Object>> answers, @PathVariable Long courseId,
			@RequestHeader("Authorization") String token) {
		return Question.calculateMarks(answers, courseId, token);
	}

	@GetMapping("/test/getQuestion/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getQuestion(@PathVariable Long questionId, @RequestHeader("Authorization") String token) {
		return Question.getQuestion(questionId, token);
	}

	@DeleteMapping("/test/questions")
	@CheckAccessAnnotation
	public ResponseEntity<?> deleteQuestion(@RequestParam List<Long> questionIds, @RequestParam Long testId,
			@RequestHeader("Authorization") String token) {
		return Question.deleteQuestion(questionIds, token, testId);
	}

	@PatchMapping("/test/edit/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateQuestion(@PathVariable Long questionId, @RequestParam String questionText,
			@RequestParam String option1, @RequestParam String option2, @RequestParam String option3,
			@RequestParam String option4, @RequestParam String answer, @RequestHeader("Authorization") String token) {
		return Question.updateQuestion(questionId, questionText, option1, option2, option3, option4, answer, token);
	}

	@PostMapping("/test/add/{testId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> Addmore(@PathVariable Long testId, @RequestParam String questionText,
			@RequestParam String option1, @RequestParam String option2, @RequestParam String option3,
			@RequestParam String option4, @RequestParam String answer, @RequestHeader("Authorization") String token) {
		return Question.Addmore(testId, questionText, option1, option2, option3, option4, answer, token);
	}

//--------------------------------Test Controller-------------------------
	@PostMapping("/test/create/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<String> createTest(@PathVariable Long courseId, @RequestBody CourseTest test,
			@RequestHeader("Authorization") String token) {
		return testcontroller.createTest(courseId, test, token);
	}

	@GetMapping("/test/getall/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getTestsByCourseIdonly(@PathVariable Long courseId,
			@RequestHeader("Authorization") String token) {
		return testcontroller.getTestsByCourseIdonly(courseId, token);
	}

	@GetMapping("/test/getTestByCourseId/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getTestByCourseId(@PathVariable Long courseId,
			@RequestHeader("Authorization") String token) {
		return testcontroller.getTestByCourseId(courseId, token);
	}

	@PatchMapping("/test/update/{testId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> editTest(@PathVariable Long testId,
			@RequestParam(value = "testName", required = false) String testName,
			@RequestParam(value = "noofattempt", required = false) Long noOfAttempt,
			@RequestParam(value = "passPercentage", required = false) Double passPercentage,
			@RequestHeader("Authorization") String token) {
		return testcontroller.editTest(testId, testName, noOfAttempt, passPercentage, token);
	}

	@GetMapping("/get/TestHistory/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getTestHistory(@PathVariable Long batchId, @RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
		return testcontroller.getTestHistory(token, batchId, page, size);
	}

	@GetMapping("/get/TestHistoryForUser/{email}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getTestHistoryforUser(@PathVariable Long batchId, @PathVariable String email,
			@RequestHeader("Authorization") String token, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size) {
		return testcontroller.getTestHistoryforUser(token, batchId, email, page, size);
	}

//----------------------PaymentIntegration----------------------	
	@PostMapping("/Batch/getOrderSummary")
	@CheckAccessAnnotation
	public ResponseEntity<?> getBatchOrderSummary(@RequestBody Map<String, Long> requestData,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return paymentservice.getBatchordersummary(requestData, token);
		}
	}

	@PostMapping("/full/buyBatch/create")
	@CheckAccessAnnotation
	public ResponseEntity<?> createOrderfullForBatch(@RequestBody Map<String, Long> requestData,
			@RequestParam("gateway") String gateway, HttpServletRequest request,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return paymentservice.createOrderfullforBatch(requestData, gateway, token, request);
		}
	}

	@GetMapping("/get/Pendings")
	@CheckAccessAnnotation
	public ResponseEntity<?> getpendingPayments(@RequestHeader("Authorization") String token) {
		return batchService.GetPendingPayments(token);
	}
	// =========batch end=========

	@PostMapping("/buyCourse/payment")
	@CheckAccessAnnotation
	public ResponseEntity<String> updatePaymentId(HttpServletRequest request,
			@RequestBody Map<String, String> requestData, @RequestHeader("Authorization") String token) {

		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return payment.updatePaymentId(request, requestData, token);

		}
	}

	@PostMapping("/buyCourse/updatePaypalPaymentId")
	@CheckAccessAnnotation
	public ResponseEntity<String> updatePayPalPayment(HttpServletRequest request,
			@RequestBody Map<String, String> requestData, @RequestHeader("Authorization") String token) {

		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return payment2.updatePayPalPayment(request, requestData, token);
		}
	}

	@PostMapping("/buyCourse/updateStripepaymentid")
	@CheckAccessAnnotation
	public ResponseEntity<String> updateStripepaymentid(HttpServletRequest request,
			@RequestBody Map<String, String> requestData, @RequestHeader("Authorization") String token) {

		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return payment.updateStripepaymentid(request, requestData, token);

		}
	}

//-------------------------paymentListcontrller-------------
	@GetMapping("/myPaymentHistory")
	@CheckAccessAnnotation
	public ResponseEntity<?> ViewMypaymentHistry(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			if (paylist != null) {
				return paylist.ViewMypaymentHistry(token);
			}
			return null;
		}
	}

	@GetMapping("/viewPaymentList/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetPartPayDetails(@RequestHeader("Authorization") String token,
			@PathVariable Long batchId) {
		return batchService.GetPartPayDetails(batchId, token);
	}

	@GetMapping("/viewAllTransactionHistory")
	@CheckAccessAnnotation
	public ResponseEntity<?> viewTransactionHistory(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			if (paylist != null) {
				return paylist.viewTransactionHistory(token);
			}
			return null;
		}
	}

//-------------------------LicenseController-----------------------
	@GetMapping("/api/v2/GetAllUser")
	public ResponseEntity<?> getAllUserforLicencecheck(@RequestHeader("Authorization") String token) {
		if (environment.equals("SAS")) {
			return licence.getAllUserSAS(token);
		} else if (environment.equals("VPS")) {
			return licence.getAllUser();
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Licence get functionality disabled");

		}
	}

	@GetMapping("/api/v2/count")
	@CheckAccessAnnotation
	public ResponseEntity<Integer> count(@RequestHeader("Authorization") String token) {
		return licence.count(token);
	}

	@PostMapping("/api/v2/uploadfile")
	@CheckAccessAnnotation
	public ResponseEntity<?> upload(@RequestParam("audioFile") MultipartFile File,
			@RequestParam("lastModifiedDate") String lastModifiedDate, @RequestHeader("Authorization") String token) {
		if (environment.equals("VPS")) {
			return licence.upload(File, lastModifiedDate, token);
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Licence upload functionality disabled");

		}
	}

	// SECOND---------------------------
	@GetMapping("/licence/getinfo")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetLicenceDetails(@RequestHeader("Authorization") String token) {
		return licencesec.GetLicenseDetails(token);
	}

	@GetMapping("/licence/getinfo/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetLicenseDetailsofadmin(@RequestHeader("Authorization") String token,
			@PathVariable String email) {
		return licencesec.GetLicenseDetailsofadmin(token, email);
	}

	// ------------------------SettingsController------------------------
	@GetMapping("/get/stripe/publishkey")
	@CheckAccessAnnotation
	public ResponseEntity<?> getpublishkey(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.getpublishkey(token);
		}
	}

	@PostMapping("/api/Paymentsettings")
	@CheckAccessAnnotation
	public ResponseEntity<?> SavePaymentDetails(@RequestBody Paymentsettings data,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.SavePaymentDetails(data, token);
		}
	}

	@GetMapping("/api/getPaymentDetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetPaymentDetails(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.GetPaymentDetails(token);
		}
	}

	@PatchMapping("/api/update/{payid}")
	@CheckAccessAnnotation
	public ResponseEntity<?> editpayment(@PathVariable Long payid,
			@RequestParam(value = "razorpay_key", required = false) String razorpay_key,
			@RequestParam(value = "razorpay_secret_key", required = false) String razorpay_secret_key,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.editpayment(payid, razorpay_key, razorpay_secret_key, token);
		}
	}

	// =======Stripe========
	@PostMapping("/api/save/stripekeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveStripedetails(@RequestBody Stripesettings stripedata,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.SaveStripedetails(token, stripedata);
		}
	}

	@GetMapping("/api/get/stripekeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetstripeKeys(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.GetstripeKeys(token);
		}
	}

	// --------------paypal--------------
	@PostMapping("/api/save/PaypalKeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> SavepaypalKeys(@RequestBody Paypalsettings paypaldata,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.SavePaypaldetails(token, paypaldata);
		}
	}

	@GetMapping("/api/get/PaypalKeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetpaypalKeys(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return settings.GetpaypalKeys(token);
		}
	}

	@PostMapping("/api/feedback")
	public Feedback feedback(@RequestBody Feedback data) {
		return settings.feedback(data);
	}

	// ======================EnablePaymentCController==========================
	@GetMapping("/get/paytypedetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> getpaytypedetails(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return enablectrl.getpaytypedetails(token);
		}
	}

	@GetMapping("/get/paytypedetailsforUser")
	@CheckAccessAnnotation
	public ResponseEntity<?> getpaytypedetailsforuser(@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Payment functionality disabled");
		} else {
			return enablectrl.getpaytypedetailsforuser(token);
		}
	}

	@PostMapping("save/PayTypeDetails")
	@CheckAccessAnnotation
	public Boolean updatePaymenttypes(@RequestParam Boolean isEnabled, @RequestParam String paymentTypeName,
			@RequestHeader("Authorization") String token) {
		if (paylist != null && activeProfile.equals("demo")) {

			return false;
		} else {
			return enablectrl.updatePaymenttypes(isEnabled, paymentTypeName, token);
		}
	}

//--------------------AddUser---------------------------
	@PostMapping("/admin/addTrainer")
	@CheckAccessAnnotation
	public ResponseEntity<?> addTrainer(HttpServletRequest request, @RequestParam(required = false) String username,
			@RequestParam String psw, @RequestParam String email, @RequestParam(required = false) LocalDate dob,
			@RequestParam String phone, @RequestParam(required = false) String skills,
			@RequestParam(required = false) MultipartFile profile, @RequestParam Boolean isActive,
			@RequestParam(defaultValue = "+91") String countryCode, @RequestHeader("Authorization") String token,
			@RequestParam String otp) {
		return adduser.addTrainer(request, username, psw, email, dob, phone, skills, profile, isActive, countryCode,
				token, otp);
	}

	@PostMapping("/admin/addStudent")
	@CheckAccessAnnotation
	public ResponseEntity<?> addStudent(HttpServletRequest request, @RequestParam(required = false) String username,
			@RequestParam String psw, @RequestParam String email, @RequestParam(required = false) LocalDate dob,
			@RequestParam String phone, @RequestParam(required = false) String skills,
			@RequestParam(required = false) MultipartFile profile, @RequestParam Boolean isActive,
			@RequestParam(defaultValue = "+91") String countryCode, @RequestHeader("Authorization") String token,
			@RequestParam String otp) {
		return adduser.addStudent(request, username, psw, email, dob, phone, skills, profile, isActive, countryCode,
				token, otp);

	}

	@DeleteMapping("/admin/deactivate/trainer")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeactivateTrainer(@RequestParam("email") String email,
			@RequestParam("reason") String reason, @RequestHeader("Authorization") String token) {
		return adduser.DeactivateTrainer(reason, email, token);
	}

	@DeleteMapping("/admin/Activate/trainer")
	@CheckAccessAnnotation
	public ResponseEntity<?> activateTrainer(@RequestParam("email") String email,
			@RequestHeader("Authorization") String token) {
		return adduser.activateTrainer(email, token);
	}

	@DeleteMapping("/admin/deactivate/Student")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeactivateStudent(@RequestParam("email") String email,
			@RequestParam("reason") String reason, @RequestHeader("Authorization") String token) {
		return adduser.DeactivateStudent(reason, email, token);
	}

	@DeleteMapping("/admin/Activate/Student")
	@CheckAccessAnnotation
	public ResponseEntity<?> activateStudent(@RequestParam("email") String email,
			@RequestHeader("Authorization") String token) {
		return adduser.activateStudent(email, token);
	}

	// --------------------------Authentication Controller------------------

	@PostMapping("/refreshtoken")
	@CheckAccessAnnotation
	public ResponseEntity<?> Refresh(@RequestHeader("Authorization") String token) {
		return authcontrol.refreshtoken(token);
	}

	@PostMapping("/logout")
	@CheckAccessAnnotation
	public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
		return authcontrol.logout(token);
	}

	@Transactional
	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
		return authcontrol.login(loginRequest);
	}

	@Transactional
	@PostMapping("/forgetpassword")
	public ResponseEntity<?> forgetPassword(@RequestParam("email") String email) {
		return authcontrol.forgetPassword(email);
	}

	@Transactional
	@PostMapping("/resetpassword")
	public ResponseEntity<?> resetPassword(@RequestParam("email") String email,
			@RequestParam("password") String newPassword) {
		return authcontrol.resetPassword(email, newPassword);
	}

//---------------------------EDIT USER------------------------------------
	@PatchMapping("/Edit/Student/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateStudent(@PathVariable("email") String originalEmail,
			@RequestParam(name = "username", required = false) String username, @RequestParam("email") String newEmail,
			@RequestParam(name = "dob", required = false) LocalDate dob, @RequestParam("phone") String phone,
			@RequestParam(name = "skills", required = false) String skills,
			@RequestParam(value = "profile", required = false) MultipartFile profile,
			@RequestParam("isActive") Boolean isActive,
			@RequestParam(name = "countryCode", defaultValue = "+91") String countryCode,
			@RequestHeader("Authorization") String token) {
		return edit.updateStudent(originalEmail, username, newEmail, dob, phone, skills, profile, isActive, countryCode,
				token);
	}

	@PatchMapping("/Edit/Trainer/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateTrainer(@PathVariable("email") String originalEmail,
			@RequestParam(name = "username", required = false) String username, @RequestParam("email") String newEmail,
			@RequestParam(name = "dob", required = false) LocalDate dob, @RequestParam("phone") String phone,
			@RequestParam(name = "skills", required = false) String skills,
			@RequestParam(value = "profile", required = false) MultipartFile profile,
			@RequestParam("isActive") Boolean isActive,
			@RequestParam(name = "countryCode", defaultValue = "+91") String countryCode,
			@RequestHeader("Authorization") String token) {
		return edit.updateTrainer(originalEmail, username, newEmail, dob, phone, skills, profile, isActive, countryCode,
				token);
	}

	@PatchMapping("/Edit/self")
	@CheckAccessAnnotation
	public ResponseEntity<?> EditProfile(@RequestParam(required = false) String username,
			@RequestParam("email") String newEmail, @RequestParam(name = "dob", required = false) LocalDate dob,
			@RequestParam String phone, @RequestParam(required = false) String skills,
			@RequestParam(required = false) MultipartFile profile, @RequestParam Boolean isActive,
			@RequestHeader("Authorization") String token, @RequestParam(defaultValue = "+91") String countryCode) {
		return edit.EditProfile(username, newEmail, dob, phone, skills, profile, isActive, countryCode, token);
	}

	@GetMapping("/Edit/profiledetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> NameandProfile(@RequestHeader("Authorization") String token) {
		return edit.NameandProfile(token);

	}
	// ----------------------------ListView------------------------

	@GetMapping("/view/batch/{email}")
	@CheckAccessAnnotation
	public List<SearchDto> getBatchOfUser(@PathVariable String email, @RequestHeader("Authorization") String token) {
		return listview.getBatchesOfUser(token, email);
	}

	@GetMapping("/view/users")
	@CheckAccessAnnotation
	public ResponseEntity<?> getUsersByRoleName(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		return listview.getUsersByRoleName(token, pageNumber, pageSize);
	}

	@GetMapping("/view/users/{userId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getUserById(@PathVariable Long userId, @RequestHeader("Authorization") String token) {
		return listview.getUserById(userId, token);
	}

	@GetMapping("/view/Trainer")
	@CheckAccessAnnotation
	public ResponseEntity<?> getTrainerByRoleName(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		return listview.getTrainerByRoleName(token, pageNumber, pageSize);
	}

	@GetMapping("/view/Mystudent")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> GetStudentsOfTrainer(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		return listview.GetStudentsOfTrainer(token, pageNumber, pageSize);
	}

	@GetMapping("/view/Approvals")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> getallApprovals(@RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize) {
		return listview.getallApprovals(token, pageNumber, pageSize);
	}

	@PostMapping("/Reject/User/{id}")
	@CheckAccessAnnotation
	public ResponseEntity<?> RejectUser(@PathVariable Long id, @RequestHeader("Authorization") String token) {
		return listview.RejectUser(id, token);
	}

	@PostMapping("/approve/User/{id}")
	@CheckAccessAnnotation
	public ResponseEntity<?> approveUser(HttpServletRequest request, @PathVariable Long id,
			@RequestHeader("Authorization") String token) {
		return listview.ApproveUser(request, id, token);
	}

	@GetMapping("/search/users")
	@CheckAccessAnnotation
	public ResponseEntity<List<?>> getusersSearch(@RequestHeader("Authorization") String token,
			@RequestParam("query") String query) {
		return listview.SearchEmail(token, query);
	}

	@GetMapping("/search/usersbyTrainer")
	@CheckAccessAnnotation
	public ResponseEntity<List<String>> getusersSearchbytrainer(@RequestHeader("Authorization") String token,
			@RequestParam("query") String query) {
		return listview.SearchEmailTrainer(token, query);
	}

	@GetMapping("/admin/search")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchAdmin(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam("institutionName") String institutionName,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchAdmin(username, email, phone, dob, institutionName, skills, page, size, token);
	}

	@GetMapping("/trainer/search")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchTrainer(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam("institutionName") String institutionName,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchTrainer(username, email, phone, dob, institutionName, skills, page, size, token);
	}

	@GetMapping("/users/search")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchUsers(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam("institutionName") String institutionName,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchUser(username, email, phone, dob, institutionName, skills, page, size, token);
	}

	@GetMapping("/Institution/search/Approvals")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchApproval(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "role", required = false) String roleName,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchApprovalByAdmin(username, email, phone, dob, skills, roleName, page, size, token);
	}

	@GetMapping("/Institution/search/Trainer")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchTrainerByadmin(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchTrainerByAdmin(username, email, phone, dob, skills, page, size, token);
	}

	@GetMapping("/Institution/search/User")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchUserByadmin(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchUserByAdminorTrainer(username, email, phone, dob, skills, page, size, token);
	}

	@GetMapping("/Institution/search/Mystudent")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchMystudent(
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return listview.searchStudentsOfTrainer(username, email, phone, dob, skills, page, size, token);
	}

//------------------------MuserRegistrationController------------------------------
	@PostMapping("/Student/register")
	public ResponseEntity<?> RegisterStudent(HttpServletRequest request,
			@RequestParam(required = false) String username, @RequestParam String psw, @RequestParam String email,
			@RequestParam(required = false) LocalDate dob, @RequestParam String role, @RequestParam String phone,
			@RequestParam(required = false) String skills, @RequestParam(required = false) MultipartFile profile,
			@RequestParam Boolean isActive, @RequestParam(defaultValue = "+91") String countryCode,
			@RequestParam String otp) {
		return muserreg.RegisterStudent(request, username, psw, email, dob, role, phone, skills, profile, isActive,
				countryCode, otp);
	}

	@GetMapping("/count/admin")
	public Long CountAdmin() {
		return muserreg.countadmin();
	}

	@PostMapping("/Trainer/register")
	public ResponseEntity<?> RegisterTrainer(HttpServletRequest request,
			@RequestParam(required = false) String username, @RequestParam String psw, @RequestParam String email,
			@RequestParam(required = false) LocalDate dob, @RequestParam String role, @RequestParam String phone,
			@RequestParam(required = false) String skills, @RequestParam(required = false) MultipartFile profile,
			@RequestParam Boolean isActive, @RequestParam(defaultValue = "+91") String countryCode,
			@RequestParam String otp) {
		return muserreg.RegisterTrainer(request, username, psw, email, dob, role, phone, skills, profile, isActive,
				countryCode, otp);
	}

	@PostMapping("/admin/register")
	public ResponseEntity<?> registerAdmin(HttpServletRequest request, @RequestParam(required = false) String username,
			@RequestParam String psw, @RequestParam String email, @RequestParam String institutionName,
			@RequestParam(required = false) LocalDate dob, @RequestParam String role, @RequestParam String phone,
			@RequestParam(required = false) String skills, @RequestParam(required = false) MultipartFile profile,
			@RequestParam Boolean isActive, @RequestParam(defaultValue = "+91") String countryCode,
			@RequestParam String otp) {
		return muserreg.registerAdmin(request, username, psw, email, institutionName, dob, role, phone, skills, profile,
				isActive, countryCode, otp);
	}

	@GetMapping("/student/users/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getUserByEmail(@PathVariable String email, @RequestHeader("Authorization") String token) {
		return muserreg.getUserByEmail(email, token);
	}

	@GetMapping("/student/admin/getTrainer/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getTrainerDetailsByEmail(@PathVariable String email,
			@RequestHeader("Authorization") String token) {
		return muserreg.getTrainerDetailsByEmail(email, token);
	}

	@GetMapping("/student/admin/getstudent/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getStudentDetailsByEmail(@PathVariable String email,
			@RequestHeader("Authorization") String token) {
		return muserreg.getStudentDetailsByEmail(email, token);
	}

	@GetMapping("/details/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getDetailsbyemail(@PathVariable String email,
			@RequestHeader("Authorization") String token) {
		return muserreg.getDetailsbyemail(email, token);
	}

	// --------------------------certificate Contoller----------------------

	@PostMapping("/certificate/add")
	@CheckAccessAnnotation
	public ResponseEntity<?> addcertificate(@RequestParam("institutionName") String institutionName,
			@RequestParam("ownerName") String ownerName, @RequestParam("qualification") String qualification,
			@RequestParam("address") String address, @RequestParam("authorizedSign") MultipartFile authorizedSign,
			@RequestHeader("Authorization") String token) {
		return certi.addcertificate(institutionName, ownerName, qualification, address, authorizedSign, token);
	}

	@PatchMapping("/certificate/Edit")
	@CheckAccessAnnotation
	public ResponseEntity<String> editcertificate(@RequestParam("institutionName") String institutionName,
			@RequestParam("ownerName") String ownerName, @RequestParam("qualification") String qualification,
			@RequestParam("address") String address,
			@RequestParam(value = "authorizedSign", required = false) MultipartFile authorizedSign,
			@RequestParam("certificateId") Long certificateId, @RequestHeader("Authorization") String token) {
		return certi.editcertificate(institutionName, ownerName, qualification, address, authorizedSign, certificateId,
				token);
	}

	@GetMapping("/certificate/viewAll")
	@CheckAccessAnnotation
	public ResponseEntity<?> viewCoursecertificate(@RequestHeader("Authorization") String token) {
		return certi.viewCoursecertificate(token);
	}

	@GetMapping("/certificate/getAllCertificate")
	@CheckAccessAnnotation
	public ResponseEntity<?> sendAllCertificate(@RequestHeader("Authorization") String token) {
		return certi.sendAllCertificate(token);
	}

	@GetMapping("/certificate/getByActivityId/{activityId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getByActivityId(@PathVariable Long activityId,
			@RequestHeader("Authorization") String token) {
		return certi.getByActivityId(activityId, token);
	}

	// -----------------------------------Notification
	// Controller-------------------------------------------------
	@GetMapping("/notifications")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetAllNotification(@RequestHeader("Authorization") String token) {
		return noticontroller.GetAllNotification(token);
	}

	@PostMapping("/MarkAllASRead")
	@CheckAccessAnnotation
	public ResponseEntity<?> MarkALLAsRead(@RequestHeader("Authorization") String token,
			@RequestBody List<Long> notiIds) {
		return noticontroller.MarkALLasRead(token, notiIds);
	}

	@GetMapping("/unreadCount")
	@CheckAccessAnnotation
	public ResponseEntity<?> UreadCount(@RequestHeader("Authorization") String token) {
		return noticontroller.UreadCount(token);
	}

	@GetMapping("/clearAll")
	@CheckAccessAnnotation
	public ResponseEntity<?> ClearAll(@RequestHeader("Authorization") String token) {
		return noticontroller.ClearAll(token);
	}

	@PostMapping("/getImages")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetNotiImage(@RequestHeader("Authorization") String token,
			@RequestBody List<Long> notifyIds) {
		return noticontroller.GetNotiImage(token, notifyIds);

	}

	// ------------------------------------------SYSADMIN
	// CONTROl------------------------------

	// --------------------ZOOM-------------------------------

	@PostMapping("/api/zoom/create-meeting")
	@CheckAccessAnnotation
	public ResponseEntity<?> createMeeting(@RequestBody MeetingRequest meetingReq,
			@RequestHeader("Authorization") String token) {
		return zoomMeetingService.createMeetReq(meetingReq, token);

	}

	@GetMapping("/api/zoom/Join/{meetingId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> JoinMeeting(@PathVariable Long meetingId, @RequestHeader("Authorization") String token) {
		return zoomMeetingService.JoinMeeting(token, meetingId);
	}

	@GetMapping("/api/zoom/getMyMeetings")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetMyMeetings(@RequestHeader("Authorization") String token) {
		return zoomMeetingService.getMetting(token);
	}

	@GetMapping("/api/zoom/get/meet/{meetingId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetmeetbyMeetingId(@PathVariable Long meetingId,
			@RequestHeader("Authorization") String token) {
		return zoomMeetingService.getMeetDetailsForEdit(token, meetingId);
	}

	@GetMapping("/api/zoom/getVirtualMeet")
	@CheckAccessAnnotation
	public ResponseEntity<?> getvirtualMeet(@RequestHeader("Authorization") String token) {
		return zoomMeetingService.getVirtualClass(token);
	}

	@PatchMapping("/api/zoom/meet/{meetingId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> EditMeetingByMeetingId(@RequestBody MeetingRequest meetingReq,
			@PathVariable Long meetingId, @RequestHeader("Authorization") String token) {
		return zoomMeetingService.EditZoomMeetReq(meetingReq, meetingId, token);
	}

	@DeleteMapping("/api/zoom/delete/{meetingId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeleteMeeting(@PathVariable Long meetingId, @RequestHeader("Authorization") String token) {
		return zoomMeetingService.DeleteMeet(meetingId, token);
	}

//---------------------------ZOOM ACCOUNT CONTROLLER_------------
	@PostMapping("/zoom/save/Accountdetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveAccountDetails(@RequestBody ZoomAccountKeys accountdetails,
			@RequestHeader("Authorization") String token) {
		return zoomaccountconfig.SaveAccountDetails(accountdetails, token);
	}

	@PatchMapping("/zoom/Edit/Accountdetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> EditAccountDetails(@RequestBody ZoomAccountKeys accountdetails,
			@RequestHeader("Authorization") String token) {
		return zoomaccountconfig.EditAccountDetails(accountdetails, token);
	}

	@GetMapping("/zoom/get/Accountdetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> getMethodName(@RequestHeader("Authorization") String token) {
		return zoomaccountconfig.getMethodName(token);
	}

	// -------------------EMAIL CONTROLLER--------------------------

	@GetMapping("/get/mailkeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> getMailkeys(@RequestHeader("Authorization") String token) {
		return emailcontroller.getMailkeys(token);
	}

	@PatchMapping("/Edit/mailkeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> UpdateMailkeys(@RequestHeader("Authorization") String token,
			@RequestBody Mailkeys mailkeys) {
		return emailcontroller.UpdateMailkeys(token, mailkeys);
	}

	@PostMapping("/save/mailkeys")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveMail(@RequestHeader("Authorization") String token, @RequestBody Mailkeys mailkeys) {
		return emailcontroller.saveMail(token, mailkeys);
	}

//-------------------------------------------ROLE DISPLAY CONTROLLER----------------------------------------------------
	@GetMapping("/get/displayName")
	@CheckAccessAnnotation
	public ResponseEntity<?> getdisplayNames(@RequestHeader("Authorization") String token) {
		return displayctrl.getdisplayNames(token);
	}

	@PatchMapping("/edit/displayname")
	@CheckAccessAnnotation
	public ResponseEntity<?> UpdateDisplayName(@RequestHeader("Authorization") String token,
			@RequestBody Role_display_name displayName) {
		return displayctrl.UpdateDisplayName(token, displayName);
	}

	@PostMapping("/post/displayname")
	@CheckAccessAnnotation
	public ResponseEntity<?> postDisplayname(@RequestHeader("Authorization") String token,
			@RequestBody Role_display_name roledisplaynames) {
		return displayctrl.postDisplayname(token, roledisplaynames);
	}

//-------------------------------------SettingsController---------------------------------------------
	@GetMapping("/settings/viewCourseInLanding")
	public Boolean isViewCourseinLandingPageEnabled() {
		try {
			if (environment.equals("VPS")) {
				return settingcontroller.isViewCourseinLandingPageEnabled();
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return null;
		}

	}

	@GetMapping("/settings/AttendanceThresholdMinutes")
	public Long getAttendanceThresholdMinutes() {
		try {
			if (environment.equals("VPS")) {
				return settingcontroller.getAttendanceThresholdMinutes();
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return null;
		}

	}

	@GetMapping("/settings/ShowSocialLogin")
	public Boolean isSocialLoginEnabled() {
		try {
			if (environment.equals("VPS")) {
				return settingcontroller.isSocialLoginEnabled();
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return null;
		}
	}

	@PostMapping("/settings/viewCourseInLanding")
	@CheckAccessAnnotation
	public Boolean updateViewCourseInLandingPage(@RequestBody Boolean isEnabled,
			@RequestHeader("Authorization") String token) {
		try {
			if (environment.equals("VPS")) {
				return settingcontroller.updateViewCourseInLandingPage(isEnabled, token);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return null;
		}
	}

	@PostMapping("/settings/updateAttendanceThreshold")
	@CheckAccessAnnotation
	public Long setAttendanceThresholdMinutes(@RequestBody Long minuites,
			@RequestHeader("Authorization") String token) {
		try {
			if (environment.equals("VPS")) {
				return settingcontroller.setAttendanceThresholdMinutes(minuites, token);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return null;
		}
	}

	@PostMapping("/settings/ShowSocialLogin")
	@CheckAccessAnnotation
	public Boolean updateSocialLoginEnabled(@RequestBody Boolean isEnabled,
			@RequestHeader("Authorization") String token) {
		try {
			if (environment.equals("VPS")) {
				return settingcontroller.updateSocialLogin(isEnabled, token);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return null;
		}
	}

	// ========================================GoogleLogin=================================

	@PostMapping("/api/auth/google")
	public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> tokenMap) {
		try {
			if (environment.equals("VPS")) {
				return googleauth.googleLogin(tokenMap);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@GetMapping("/getgoogleclient")
	public String getClientid(@RequestParam(required = false) String institution, @RequestParam String Provider) {
		try {
			if (environment.equals("VPS")) {
				return googleauth.getClientidforgoogle(institution, Provider);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	// ===========================================Labelling===========================================
	@GetMapping("/getTheme")
	public Map<String, String> getTheme() {
		return labelingctrl.getPrimaryColor();
	}

	@PostMapping("/save/labellings")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveLabellingitems(@RequestHeader("Authorization") String token,
			@RequestParam(required = false) String siteUrl, @RequestParam(required = false) String title,
			@RequestParam(required = false) MultipartFile sitelogo,
			@RequestParam(required = false) MultipartFile siteicon,
			@RequestParam(required = false) MultipartFile titleicon) {
		try {
			if (environment.equals("VPS")) {
				return labelingctrl.SaveLabellingitems(token, siteUrl, title, sitelogo, siteicon, titleicon);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@GetMapping("/log/time/{id}")
	public ResponseEntity<?> errorSendindToMail(@PathVariable int id) {
		return logmanagement.logdetails(id);
	}

	@GetMapping("/triggerError")
	public ResponseEntity<String> triggerError() {
		try {
			causeException();
			return ResponseEntity.ok("No error occurred on try");
		} catch (Exception e) {
			logger.error("", e);
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("" + e);
		}
	}

	@RequestMapping("favicon.ico")
	public void favicon() {
		// Respond with nothing or redirect to another resource.
	}

	// Method that intentionally throws an exception
	private void causeException() throws Exception {
		throw new Exception("This is a simulated exception for testing purposes.");
	}

	@GetMapping("/Get/labellings")
	@CheckAccessAnnotation
	public ResponseEntity<?> getLabelingitems(@RequestHeader("Authorization") String token) {
		try {
			if (environment.equals("VPS")) {
				return labelingctrl.getLabelingitems(token);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@GetMapping("/all/get/labellings")
	public ResponseEntity<?> getLabelingitemsforall() {
		try {
			if (environment.equals("VPS")) {
				return labelingctrl.getLabelingitemsforall();
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
//==============================Footer=======================================

	@PostMapping("/save/FooterDetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveFooterDetails(@RequestHeader("Authorization") String token,
			@RequestBody FooterDetails footerdetails) {
		try {
			if (environment.equals("VPS")) {
				return footerctrl.SaveFooterDetails(token, footerdetails);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@GetMapping("/Get/FooterDetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> Getfooterdetails(@RequestHeader("Authorization") String token) {
		try {
			if (environment.equals("VPS")) {
				return footerctrl.Getfooterdetails(token);
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	@GetMapping("/all/get/FooterDetails")
	public ResponseEntity<?> getFooteritemsForAll() {
		try {
			if (environment.equals("VPS")) {
				return footerctrl.getFooteritemsForAll();
			} else {
				return null;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	/// ======================Batch Service========================
	@GetMapping("/searchCourse")
	@CheckAccessAnnotation
	public List<Map<String, Object>> searchCourses(@RequestParam String courseName,
			@RequestHeader("Authorization") String token) {
		return batchService.searchCourses(courseName, token);
	}

	@GetMapping("/searchBatch")
	@CheckAccessAnnotation
	public List<Map<String, Object>> searchBatch(@RequestParam String batchTitle,
			@RequestHeader("Authorization") String token) {
		return batchService.searchbatch(batchTitle, token);
	}

	@GetMapping("/searchTrainer")
	@CheckAccessAnnotation
	public List<Map<String, Object>> searchTrainer(@RequestParam String userName,
			@RequestHeader("Authorization") String token) {
		return batchService.searchTrainers(userName, token);
	}

	@PostMapping(value = "/batch/save")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveBatch(@RequestParam("batchTitle") String batchTitle,
			@RequestParam("startDate") LocalDate startDate, @RequestParam("endDate") LocalDate endDate,
			@RequestParam("noOfSeats") Long noOfSeats, @RequestParam("amount") Long amount,
			@RequestParam("courses") String courses, // Assuming it's a JSON string of courses
			@RequestParam("trainers") String trainers, // Assuming it's a JSON string of trainers
			@RequestParam(value = "batchImage", required = false) MultipartFile batchImage,
			@RequestHeader("Authorization") String token) {
		return batchService.saveBatch(batchTitle, startDate, endDate, noOfSeats, amount, courses, trainers, batchImage,
				token);
	}

	@PatchMapping(value = "/batch/Edit/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> EditBatch(@PathVariable("batchId") Long batchId,
			@RequestParam("batchTitle") String batchTitle, @RequestParam("startDate") LocalDate startDate,
			@RequestParam("endDate") LocalDate endDate, @RequestParam("noOfSeats") Long noOfSeats,
			@RequestParam("amount") Long amount, @RequestParam("courses") String courses,
			@RequestParam("trainers") String trainers, // Assuming it's a JSON string of trainers
			@RequestParam(value = "batchImage", required = false) MultipartFile batchImage,
			@RequestHeader("Authorization") String token) {
		return batchService.updateBatch(batchId, batchTitle, startDate, endDate, noOfSeats, amount, courses, trainers,
				batchImage, token);
	}

	@PostMapping(value = "/batch/partial/save")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveBatchforCourseCreation(@RequestParam("batchTitle") String batchTitle,
			@RequestParam("startDate") LocalDate startDate, @RequestParam("endDate") LocalDate endDate,
			@RequestHeader("Authorization") String token) {
		return batchService.SaveBatchforCourseCreation(batchTitle, startDate, endDate, token);
	}

	@GetMapping("/Batch/get")
	@CheckAccessAnnotation
	public ResponseEntity<?> getbatch(@RequestParam Long id, @RequestHeader("Authorization") String token) {
		return batchService.GetBatch(id, token);
	}

	@GetMapping("/Batch/getAll")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAllbatch(@RequestHeader("Authorization") String token) {
		return batchService.GetAllBatch(token);
	}

	@GetMapping("/Batch/getAll/{courseid}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAllBatchforCourse(@PathVariable Long courseid,
			@RequestHeader("Authorization") String token) {
		return batchService.GetAllBatchByCourseID(token, courseid);
	}

	@GetMapping("/Batch/getCourses/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getCourseOfBatch(@PathVariable Long batchId,
			@RequestHeader("Authorization") String token) {
		return batchService.getCoursesoFBatch(batchId, token);
	}

	@DeleteMapping("/batch/delete/{batchid}")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeleteBatch(@PathVariable Long batchid, @RequestHeader("Authorization") String token) {
		return batchService.deleteBatchById(batchid, token);
	}

	@GetMapping("/Batch/getStudents")
	@CheckAccessAnnotation
	public ResponseEntity<?> getStudentsOfBatch(@RequestParam Long id, @RequestParam int pageNumber,
			@RequestParam int pageSize, @RequestHeader("Authorization") String token) {
		return batchService.getUsersoFBatch(id, token, pageNumber, pageSize);
	}

	@GetMapping("/Batch/search/User")
	@CheckAccessAnnotation
	public ResponseEntity<Page<MuserDto>> searchBatchUserByadminOrTrainer(
			@RequestParam(value = "batchId", required = true) Long batchId,
			@RequestParam(value = "username", required = false) String username,
			@RequestParam(value = "email", required = false) String email,
			@RequestParam(value = "phone", required = false) String phone,
			@RequestParam(value = "dob", required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dob,
			@RequestParam(value = "skills", required = false) String skills,
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size, @RequestHeader("Authorization") String token) {
		return batchService.searchBatchUserByAdminorTrainer(username, email, phone, dob, skills, page, size, token,
				batchId);
	}

	@GetMapping("/Batch/getImages")
	@CheckAccessAnnotation
	public ResponseEntity<?> getBatchImagesById(@RequestParam List<Long> batchIds,
			@RequestHeader("Authorization") String token) {

		// Pass both token and batchIds to the service layer
		return batchService.GetbatchImagesForMyPayments(token, batchIds);
	}

	@PostMapping("/Batch/Save/PartPayDetails")
	@CheckAccessAnnotation
	public ResponseEntity<?> savePartPayment(@RequestParam Long batchId,
			@RequestBody List<BatchInstallmentdetails> installmentDetails,
			@RequestHeader("Authorization") String token) {
		return batchService.SavePartPay(batchId, installmentDetails, token);
	}

//==========================================BAtchService2-----------------------------
	@GetMapping("/user/GetBatches/{userId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getbatchesOfUser(@PathVariable Long userId, @RequestParam int page, @RequestParam int size,
			@RequestHeader("Authorization") String token) {

		return batchService2.getEnrolledBatches(token, userId, page, size);
	}

	@GetMapping("/user/getOtherbatches/{userId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getOtherBatches(@PathVariable Long userId, @RequestParam int page, @RequestParam int size,
			@RequestHeader("Authorization") String token) {
		System.out.println(size);
		return batchService2.getOtherBatches(token, userId, page, size);
	}

	@GetMapping("/Trainer/GetBatches/{userId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getbatchesOfTrainer(@PathVariable Long userId, @RequestParam int page,
			@RequestParam int size, @RequestHeader("Authorization") String token) {

		return batchService2.getbatchesForTrainer(token, userId, page, size);
	}

	@GetMapping("/Trainer/getOtherbatches/{userId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getOtherBatchesForTrainer(@PathVariable Long userId, @RequestParam int page,
			@RequestParam int size, @RequestHeader("Authorization") String token) {
		return batchService2.getOtherBatchesForTrainer(token, userId, page, size);
	}

	// -------------------Attendance Service---------------

	@GetMapping("/view/getAttendancAnalysis/{userId}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetAttendanceAnalysis(@PathVariable Long userId, @PathVariable Long batchId,
			@RequestHeader("Authorization") String token) {
		return attendanceService.GetAttendanceAnalysis(token, userId, batchId);
	}

	@GetMapping("/view/StudentAttendance/{userId}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAttendanceForuser(@PathVariable Long userId, @PathVariable Long batchId,
			@RequestHeader("Authorization") String token, Pageable pageable) {
		return attendanceService.getAttendance(token, userId, batchId, pageable);
	}

	// -------------------Attendance Service---------------

	@GetMapping("/view/MyAttendance/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetMyAttendance(@PathVariable Long batchId, @RequestHeader("Authorization") String token,
			Pageable pageable) {
		return attendanceService.getMyAttendance(token, batchId, pageable);
	}

	@PostMapping("/update/attendance")
	@CheckAccessAnnotation
	public ResponseEntity<?> UpdateAttendance(@RequestHeader("Authorization") String token, Long Id, String status) {
		return attendanceService.updateAttendance(token, Id, status);
	}

	// =====================Quizz====================
	@PostMapping("/Quizz/Save/{lessonId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveQuizz(@RequestBody Quizz quizz, @PathVariable Long lessonId,
			@RequestHeader("Authorization") String token) {
		return quizzService.SaveQuizz(lessonId, quizz, token);
	}

	@PostMapping("/Quizz/AddMore/{quizzId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> AddMoreQuestiontoQuizz(@RequestBody Quizzquestion question, @PathVariable Long quizzId,
			@RequestHeader("Authorization") String token) {
		return quizzService.AddMoreQuestionInQuizz(quizzId, question, token);
	}

	@GetMapping("/Quizz/{quizzId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getQuizz(@PathVariable Long quizzId, @RequestHeader("Authorization") String token) {
		return quizzService.GetQuizz(quizzId, token);
	}

	@GetMapping("/Quizz/getQuestion/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getQuizzQuestion(@PathVariable Long questionId,
			@RequestHeader("Authorization") String token) {
		return quizzService.GetQuizzQuestion(questionId, token);
	}

	@PatchMapping("/Quizz/UpdateQuestion/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> UpdateQuizzQuestion(@PathVariable Long questionId, @RequestBody Quizzquestion question,
			@RequestHeader("Authorization") String token) {
		return quizzService.UpdateQuizzQuestion(questionId, question, token);
	}

	@PatchMapping("/Quizz/updateDuration/{quizzId}/{durationInMinutes}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateDurationInMinutes(@PathVariable Long quizzId, @PathVariable int durationInMinutes,
			@RequestHeader("Authorization") String token) {
		return quizzService.UpdateQuizzDuration(quizzId, durationInMinutes, token);
	}

	@PatchMapping("/Quizz/updatename/{quizzId}/{quizzname}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateQuizzname(@PathVariable Long quizzId, @PathVariable String quizzname,
			@RequestHeader("Authorization") String token) {
		return quizzService.UpdateQuizzName(quizzId, quizzname, token);
	}

	@DeleteMapping("/Quizz/Delete/{quizzId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeleteQuizzQuestion(@PathVariable Long quizzId, @RequestBody List<Long> questionIds,
			@RequestHeader("Authorization") String token) {
		return quizzService.DeleteQuizzQuestion(questionIds, quizzId, token);
	}

	@GetMapping("/Quizz/getSheduledQuizz/{courseId}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getSheduleQuizz(@PathVariable Long courseId, @PathVariable Long batchId,
			@RequestHeader("Authorization") String token) {
		return quizzService.getQuizzSheduleDetails(courseId, batchId, token);
	}

	@PostMapping("/Quizz/Shedule/{courseId}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveORUpdateSheduleQuizz(@RequestParam Long quizzId, @RequestParam Long batchId,
			@RequestParam LocalDate quizDate, @RequestHeader("Authorization") String token) {
		return quizzService.SaveORUpdateSheduleQuizz(quizzId, batchId, quizDate, token);
	}

	@GetMapping("/Quizz/Start")
	@CheckAccessAnnotation
	public ResponseEntity<?> StartQuizz(@RequestParam Long quizzId, @RequestParam Long batchId,
			@RequestHeader("Authorization") String token) {
		return quizzService.startQuizz(token, quizzId, batchId);
	}

	@PostMapping("/Quizz/submit")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveQuizz(@RequestParam Long quizzId, @RequestBody List<AnswerDto> answers,
			@RequestHeader("Authorization") String token) {
		return quizzService.saveQuizzAnswers(token, quizzId, answers);
	}

	@GetMapping("/get/QuizzHistory/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getQuizzHistory(@PathVariable Long batchId, @RequestHeader("Authorization") String token,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
		return quizzService.getQuizzHistory(token, batchId, page, size);
	}

	@GetMapping("/get/QuizzHistoryForuser/{email}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getQuizzHistory(@PathVariable Long batchId, @PathVariable String email,
			@RequestHeader("Authorization") String token, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size) {
		return quizzService.getQuizzHistoryforUserByAdmin(token, batchId, email, page, size);
	}

	@GetMapping("/get/QuizzAnalysis/{batchId}/{email}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getQuizzAnalysis(@PathVariable Long batchId, @PathVariable String email,
			@RequestHeader("Authorization") String token) {
		return quizzService.getQuizzAnalysis(token, batchId, email);
	}

	// ======================Event Controller================
	@GetMapping("/Events/Get")
	@CheckAccessAnnotation
	public ResponseEntity<?> getEvents(@RequestParam int pageNumber, @RequestParam int pageSize,
			@RequestHeader("Authorization") String token) {
		return eventController.getEvents(token, pageNumber, pageSize);
	}

	// =============================Weightage Service=========================
	@PostMapping("/save/Weightage")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveOrUpdateWeightage(@RequestBody Weightage weightage,
			@RequestHeader("Authorization") String token) {
		return weightageService.saveOrUpdateWeightageDetails(weightage, token);
	}

	@GetMapping("/get/Weightage")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetWeightage(@RequestHeader("Authorization") String token) {
		return weightageService.GetWeightageDetails(token);
	}

	// ========================Grade Service====================
	@GetMapping("/get/Grade")
	@CheckAccessAnnotation
	public ResponseEntity<?> getGradeScore(@RequestHeader("Authorization") String token) {
		return gradeService.getGrades(token);
	}

	@GetMapping("/Batch/getcounts")
	@CheckAccessAnnotation
	public ResponseEntity<?> getbatchAnalysis(@RequestParam Long id, @RequestHeader("Authorization") String token) {
		return gradeService.getBatchAnalysis(id, token);
	}

	@GetMapping("/get/TestGradeAnalysis/{email}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getGradeTestAnalysis(@RequestHeader("Authorization") String token,
			@PathVariable Long batchId, @PathVariable String email) {
		return gradeService.getTestAndGradeAnalysis(token, email, batchId);
	}

	@GetMapping("/get/getGradeForUser/{email}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getGradesofStudent(@RequestHeader("Authorization") String token,
			@PathVariable Long batchId, @PathVariable String email) {
		return gradeService.getGradesofStudent(token, email, batchId);
	}

	// ======================================ModuleTest
	// =============================================
	@GetMapping("/search/lesson/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> searchLessonByTitle(@PathVariable Long courseId, @RequestParam("query") String query,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.searchLessons(token, query, courseId);
	}

	@GetMapping("/get/moduleTest/{mtestId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getModuleTestById(@PathVariable Long mtestId,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.getModuleTestById(mtestId, token);
	}

	@GetMapping("/course/moduleTest/{courseId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getModuleTestforCourse(@PathVariable Long courseId,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.getModuleTestListByCourseId(courseId, token);
	}

	@PostMapping("/ModuleTest/save")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveModuleTest(@RequestBody SaveModuleTestRequest request,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.SaveModuleTest(token, request.getLessonIds(), request.getModuleTest(),
				request.getCourseId());
	}

	@PostMapping("/Moduletest/addMoreQuestion/{mtestId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> AddmoreModuleQuestion(@PathVariable Long mtestId, @RequestParam String questionText,
			@RequestParam String option1, @RequestParam String option2, @RequestParam String option3,
			@RequestParam String option4, @RequestParam String answer, @RequestHeader("Authorization") String token) {
		return ModuleTestService.addMoreModuleQuestion(mtestId, questionText, option1, option2, option3, option4,
				answer, token);
	}

	@DeleteMapping("/ModuleTest/questions")
	@CheckAccessAnnotation
	public ResponseEntity<?> deleteModuleQuestion(@RequestParam List<Long> questionIds, @RequestParam Long testId,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.deleteModuleQuestion(questionIds, token, testId);
	}

	@PatchMapping("/ModuleTest/update/{testId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> editModuleTest(@PathVariable Long testId,
			@RequestParam(value = "mtestName", required = false) String testName,
			@RequestParam(value = "mnoOfAttempt", required = false) Long noOfAttempt,
			@RequestParam(value = "mpassPercentage", required = false) Double passPercentage,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.editModuleTest(testId, testName, noOfAttempt, passPercentage, token);
	}

	@GetMapping("/ModuleTest/getQuestion/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getModuleQuestion(@PathVariable Long questionId,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.getModuleQuestion(questionId, token);
	}

	@PatchMapping("/ModuleTest/edit/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> updateModuleQuestion(@PathVariable Long questionId, @RequestParam String questionText,
			@RequestParam String option1, @RequestParam String option2, @RequestParam String option3,
			@RequestParam String option4, @RequestParam String answer, @RequestHeader("Authorization") String token) {
		return ModuleTestService.updateModuleQuestion(questionId, questionText, option1, option2, option3, option4,
				answer, token);
	}

	@PostMapping("/ModuleTest/Shedule")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveORUpdateSheduleModuleTest(@RequestParam Long mtestId, @RequestParam Long batchId,
			@RequestParam LocalDate testdate, @RequestHeader("Authorization") String token) {
		return ModuleTestService.SaveORUpdateSheduleModuleTest(mtestId, batchId, testdate, token);
	}

	@GetMapping("/ModuleTest/GetSheduleDetails/{courseId}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getSheduleModuleTest(@PathVariable Long courseId, @PathVariable Long batchId,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.getModuleTestSheduleDetails(courseId, batchId, token);
	}

	@GetMapping("/ModuleTest/Start")
	@CheckAccessAnnotation
	public ResponseEntity<?> StartModuleTest(@RequestParam Long mtestId, @RequestParam Long batchId,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.startModuleTest(token, mtestId, batchId);
	}

	@PostMapping("/ModuleTest/submit")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveModuleTestAnswer(@RequestParam Long mtestId, @RequestBody List<AnswerDto> answers,
			@RequestHeader("Authorization") String token) {
		return ModuleTestService.saveModuleTestAnswers(token, mtestId, answers);
	}

	// ====================================Assign
	// Batch===============================================================
	@PostMapping("/AssignCourse/Batch")
	@CheckAccessAnnotation
	public ResponseEntity<?> assignBatchToUser(HttpServletRequest request, @RequestParam Long userId,
			@RequestParam Long batchId, @RequestHeader("Authorization") String token) {
		return assignBatch.assignCoursesToUser(request, userId, batchId, token);
	}

	@PostMapping("/Trainer/AssignCourse/Batch")
	@CheckAccessAnnotation
	public ResponseEntity<?> assignBatchToTrainer(HttpServletRequest request, @RequestParam Long userId,
			@RequestParam Long batchId, @RequestHeader("Authorization") String token) {
		return assignBatch.assignBatchesToTrainer(request, userId, batchId, token);
	}

	// ================AssignCourse=======================
	@GetMapping("/AssignCourse/student/courselist")
	@CheckAccessAnnotation
	public ResponseEntity<List<CourseDetailDto>> getCoursesForUser(@RequestHeader("Authorization") String token) {
		return assign.getCoursesForUser(token);
	}

	@GetMapping("/AssignCourse/Trainer/courselist")
	@CheckAccessAnnotation
	public ResponseEntity<List<CourseDetailDto>> getCoursesForTrainer(@RequestHeader("Authorization") String token) {
		return assign.getCoursesForTrainer(token);
	}

//=====================Assignment Service ===========================
	@PostMapping("/Assignment/save")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveAssignment(@RequestHeader("Authorization") String token,
			@RequestBody Assignment assignment, @RequestParam Long courseId) {
		return assignmentService.saveAssignment(token, assignment, courseId);
	}

	@GetMapping("/Assignment/getAll")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAllAssignmentsByCourseId(@RequestHeader("Authorization") String token,
			@RequestParam Long courseId) {
		return assignmentService.GetAllAssignmentByCourse(token, courseId);
	}

	@DeleteMapping("/Assignment/Delete")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeleteAssignment(@RequestHeader("Authorization") String token,
			@RequestParam Long assignmentId) {
		return assignmentService.DeleteAssignment(token, assignmentId);
	}

	@DeleteMapping("/Assignment/Delete/Question")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeleteAssignmentQuestion(@RequestHeader("Authorization") String token,
			@RequestParam Long questionId) {
		return assignmentService.DeleteAssignmentQuestionById(token, questionId);
	}

	@GetMapping("/Assignment/get")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAssignmentById(@RequestHeader("Authorization") String token,
			@RequestParam Long assignmentId) {
		return assignmentService.GetAssignmentByAssignmentId(token, assignmentId);
	}

	@PatchMapping("/Assignment/Edit")
	@CheckAccessAnnotation
	public ResponseEntity<?> EditAssignment(@RequestHeader("Authorization") String token,
			@RequestBody Assignment assignment, @RequestParam Long AssignmentId) {
		return assignmentService.updateAssignment(token, assignment, AssignmentId);
	}

	@PatchMapping("/Assignment/EditQuestion")
	@CheckAccessAnnotation
	public ResponseEntity<?> saveAssignment(@RequestHeader("Authorization") String token,
			@RequestBody List<AssignmentQuestion> assignmentQuestions, @RequestParam Long AssignmentId) {
		return assignmentService.updateAssignmentQuestion(token, assignmentQuestions, AssignmentId);
	}

	@GetMapping("/Assignment/getSheduleDetail/{courseId}/{batchId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAssignmentShedule(@PathVariable Long courseId, @PathVariable Long batchId,
			@RequestHeader("Authorization") String token) {
		return assignmentService.getAssignmentSheduleDetails(courseId, batchId, token);
	}

	@PostMapping("/Assignment/Shedule")
	@CheckAccessAnnotation
	public ResponseEntity<?> SaveORUpdateSheduleAssignment(HttpServletRequest request, @RequestParam Long AssignmentId,
			@RequestParam Long batchId, @RequestParam LocalDate AssignmentDate,
			@RequestHeader("Authorization") String token) {
		return assignmentService.SaveORUpdateSheduleAssignment(request, AssignmentId, batchId, AssignmentDate, token);
	}

	@PatchMapping("/Assignment/UpdateQuestion/{questionId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> UpdateAssignmentQuizzQuestion(@PathVariable Long questionId,
			@RequestBody AssignmentQuestion question, @RequestHeader("Authorization") String token) {
		return assignmentService.UpdateAssignmentQuizzQuestion(questionId, question, token);
	}

	// ============================Attendance Service 2=========================
	@GetMapping("/Assignments/get")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAssignmentsByBatchId(@RequestParam Long batchId,
			@RequestHeader("Authorization") String token) {
		return assignmentService2.getAssignmentsBybatchId(token, batchId);
	}

	@GetMapping("/Assignment/getSubmission")
	@CheckAccessAnnotation
	public ResponseEntity<?> GetAssignmentByAssignmentIdForSubmission(@RequestHeader("Authorization") String token,
			@RequestParam Long assignmentId, @RequestParam Long batchId) {
		return assignmentService2.GetAssignmentByAssignmentIdForSubmission(token, assignmentId, batchId);
	}

	@PostMapping("/Assignment/Submit")
	@CheckAccessAnnotation
	public ResponseEntity<?> SubmitAssignment(@RequestHeader("Authorization") String token,
			@RequestParam("assignmentId") Long assignmentId, @RequestParam("batchId") Long batchId,
			@RequestParam(value = "file", required = false) MultipartFile file,
			@RequestParam(value = "answers", required = false) String answersJson) {
		return assignmentService2.SubmitAssignment(token, assignmentId, batchId, file, answersJson);
	}

	@GetMapping("/Assignments/getByStudent")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAssignmentsBybatchIdForValidation(@RequestParam Long batchId, @RequestParam Long userId,
			@RequestHeader("Authorization") String token) {
		return assignmentService2.getAssignmentsBybatchIdForValidation(token, batchId, userId);
	}

	@GetMapping("/Assignments/getAssignment")
	@CheckAccessAnnotation
	public ResponseEntity<?> getAssignmentForValidation(@RequestParam Long batchId, @RequestParam Long userId,
			@RequestParam Long assignmentId, @RequestHeader("Authorization") String token) {
		return assignmentService2.getAssignmentForValidation(token, assignmentId, batchId, userId);
	}

	@PostMapping("/Assignments/Validate")
	@CheckAccessAnnotation
	public ResponseEntity<?> ValidateAssignment(@RequestParam Long batchId, @RequestParam Long userId,
			@RequestParam String feedback, @RequestParam Integer marks, @RequestParam Long assignmentId,
			@RequestHeader("Authorization") String token) {
		return assignmentService2.ValidateAssignment(token, assignmentId, batchId, userId, feedback, marks);
	}

	@DeleteMapping("/Assignment/Delete/{assignmentId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> DeleteAssignmentQuizzQuestion(@PathVariable Long assignmentId,
			@RequestBody List<Long> questionIds, @RequestHeader("Authorization") String token) {
		return assignmentService2.DeleteAssignmentQuizzQuestion(questionIds, assignmentId, token);
	}

	@PostMapping("/Assignment/AddMore/{assignmentId}")
	@CheckAccessAnnotation
	public ResponseEntity<?> AddMoreQuestionForQuizzInAssignment(@RequestBody AssignmentQuestion question,
			@PathVariable Long assignmentId, @RequestHeader("Authorization") String token) {
		return assignmentService2.AddMoreQuestionForQuizzInAssignment(assignmentId, question, token);
	}

	// --------------------------OTP Verification----------------------
	@PostMapping("/auth/send-otp")
	public ResponseEntity<?> sendOTP(@RequestParam String email) {
		return muserreg.sendOTP(email);
	}

	@PostMapping("/auth/verify-otp")
	public ResponseEntity<?> verifyOTP(@RequestParam String email, @RequestParam String otp) {
		return muserreg.verifyOTP(email, otp);
	}
}
