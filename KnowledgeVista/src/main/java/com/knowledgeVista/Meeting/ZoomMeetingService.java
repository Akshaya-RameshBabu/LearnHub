package com.knowledgeVista.Meeting;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowledgeVista.Attendance.AttendanceService2;
import com.knowledgeVista.Attendance.Attendancedetails;
import com.knowledgeVista.Attendance.Repo.AttendanceRepo;
import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.SearchDto;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Meeting.zoomclass.Meeting;
import com.knowledgeVista.Meeting.zoomclass.MeetingRequest;
import com.knowledgeVista.Meeting.zoomclass.MeetingRequest.Recurrence;
import com.knowledgeVista.Meeting.zoomclass.MeetingRequest.Settings;
import com.knowledgeVista.Meeting.zoomclass.Recurrenceclass;
import com.knowledgeVista.Meeting.zoomclass.ZoomMeetingInvitee;
import com.knowledgeVista.Meeting.zoomclass.ZoomSettings;
import com.knowledgeVista.Meeting.zoomclass.calenderDto;
import com.knowledgeVista.Meeting.zoomclass.repo.InviteeRepo;
import com.knowledgeVista.Meeting.zoomclass.repo.Meetrepo;
import com.knowledgeVista.Meeting.zoomclass.repo.OccurancesRepo;
import com.knowledgeVista.Meeting.zoomclass.repo.VirtualmeetmapRepo;
import com.knowledgeVista.Notification.Repositories.NotificationDetailsRepo;
import com.knowledgeVista.Notification.Repositories.NotificationUserRepo;
import com.knowledgeVista.Settings.Controller.SettingsController;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.zoomJar.ZoomMethods;

@Service
public class ZoomMeetingService {

	private final ObjectMapper objectMapper;
	private final ZoomTokenService zoomTokenService;

	@Autowired
	private JwtUtil jwtUtil;
	@Autowired
	private MuserRepositories muserRepository;

	@Autowired
	private SaveMeetDataService saveservice;
	@Autowired
	private InviteeRepo inviteerepo;
	@Autowired
	private Meetrepo meetrepo;
	@Autowired
	private NotificationDetailsRepo notidetail;
	@Autowired
	private NotificationUserRepo notiuser;
	@Autowired
	private CourseDetailRepository courseRepo;
	@Autowired
	private BatchRepository batchrepo;
	@Autowired
	private SettingsController settingsctrl;
	@Autowired
	private VirtualmeetmapRepo virtualrepo;

	@Autowired
	private OccurancesRepo occurancesRepo;
	@Autowired
	private ZoomMethods zoomMethod;
	@Autowired
	private AttendanceRepo attendanceRepo;
	@Autowired
	private AttendanceService2 attendanceService2;
	@Value("${spring.environment}")
	private String environment;

	private static final Logger logger = LoggerFactory.getLogger(ZoomMeetingService.class);

	public ZoomMeetingService(ZoomTokenService zoomTokenService) {

		this.objectMapper = new ObjectMapper();
		this.zoomTokenService = zoomTokenService;

	}

	private static final ConcurrentHashMap<Long, LocalDateTime> meetingStartTimes = new ConcurrentHashMap<>();
	private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);

	@Transactional
	public ResponseEntity<?> JoinMeeting(String token, Long MeetingId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				String role = user.getRole().getRoleName();
				LocalDateTime now = LocalDateTime.now();
				Optional<Meeting> opmeet = meetrepo.FindByMeetingId(MeetingId);
				if (!opmeet.isPresent()) {
					return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Meeting Not Found");
				}
				Meeting meet = opmeet.get();
				Long min = 10L;
				if (environment.equals("VPS")) {
					min = settingsctrl.getAttendanceThresholdMinutes();
				}
				if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
					meetingStartTimes.put(MeetingId, now);
					attendanceService2.scheduleMarkAbsent(meet.getMeetingId(), min);
					System.out.println("min=" + min);
					return ResponseEntity.ok(meet.getJoinUrl());
				}

				LocalDateTime meetingStartTime = meetingStartTimes.get(MeetingId);
				if (meetingStartTime == null) {
					return ResponseEntity.status(HttpStatus.CONFLICT).body("Meeting has not started yet.");
				}
				long minutesSinceStart = ChronoUnit.MINUTES.between(meetingStartTime, now);
				if (minutesSinceStart <= min) {

					// Save Attendance
					Optional<Attendancedetails> opattendance = attendanceRepo
							.findByUserIdAndMeetingIdAndDate(user.getUserId(), MeetingId, LocalDate.now());
					if (opattendance.isPresent()) {
						Attendancedetails attendance = opattendance.get();
						attendance.setStatus("PRESENT");
						attendanceRepo.save(attendance);// need to make meetid and userid as unique one
						return ResponseEntity.ok(meet.getJoinUrl());
					} else {
						Attendancedetails attendancenew = new Attendancedetails();
						attendancenew.setUserId(user.getUserId());
						attendancenew.setMeeting(meet);
						attendancenew.setDate(LocalDate.now());
						attendancenew.setStatus("PRESENT");
						attendanceRepo.save(attendancenew);// need to make meetid and userid as unique one
						return ResponseEntity.ok(meet.getJoinUrl());
					}
				} else {
					return ResponseEntity.ok(meet.getJoinUrl());
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");
			}

		} catch (Exception e) {
			logger.error("erroroccured in Join Meeting" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@Transactional
	public void MarkRemainingAsAbsent(Long meetid) {
		try {
			System.out.println("entered in MarkRemainingAbsent");
			List<Long> presentUsers = attendanceRepo.finduserIdsByMeetingIdAndPRESENT(meetid, LocalDate.now());
			System.out.println("presentUsers=" + presentUsers);
			Optional<Meeting> opmeet = meetrepo.FindByMeetingIdwithbatch(meetid);

			if (opmeet.isPresent()) {
				Meeting meet = opmeet.get();

				// Force Hibernate to load batches
				meet.getBatches().size();

				List<Batch> batches = new ArrayList<Batch>();
				batches = meet.getBatches();
				List<Muser> allUsers = new ArrayList<>();

				for (Batch batch : batches) {
					allUsers.addAll(batchrepo.findAllusersByBatchId(batch.getId()));
				}

				for (Muser user : allUsers) {
					if (!presentUsers.contains(user.getUserId())) {
						Attendancedetails attendance = new Attendancedetails();
						attendance.setUserId(user.getUserId());
						attendance.setMeeting(meet);
						attendance.setDate(LocalDate.now());
						attendance.setStatus("ABSENT");
						attendanceRepo.save(attendance);
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public ResponseEntity<?> createMeetReq(MeetingRequest meetingReq, String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				String role = user.getRole().getRoleName();
				String InstitutionName = user.getInstitutionName();
				if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
					String accessToken = zoomTokenService.getAccessToken(InstitutionName);
					System.out.println("accessToken= " + accessToken);
					if (accessToken == null || accessToken.isEmpty()) {
						return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Access Token Generation Failed");
					}
					String json = this.convertToZoomApiJson(meetingReq);
					Meeting meettosave = this.saveMappings(meetingReq);
					String res = zoomMethod.createMeeting(json, accessToken);

					return saveservice.saveMeetData(res, email, meettosave);

				} else {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user not Found");
			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)

					.body("An error occurred while creating the meeting: " + e.getMessage());
		}
	}

	public ResponseEntity<?> EditZoomMeetReq(MeetingRequest meetingReq, Long MeetingId, String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				String role = user.getRole().getRoleName();
				String InstitutionName = user.getInstitutionName();
				if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
					String accessToken = zoomTokenService.getAccessToken(InstitutionName);
					if (accessToken == null || accessToken.isEmpty()) {
						return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Access Token Generation Failed");
					}
					String json = convertToZoomApiJsonForEdit(meetingReq);

					String res = zoomMethod.EditMeet(MeetingId, json, accessToken);

					if (res != null && !res.contains("error")) {
						Optional<Meeting> opmeeting = meetrepo.FindByMeetingId(MeetingId);
						Meeting meeting = opmeeting.orElse(null);

						if (meeting == null) {
							return ResponseEntity.status(HttpStatus.NO_CONTENT)
									.body("Meeting with ID " + MeetingId + " not found");
						}
						// Save the response data
						meeting = this.PatchMappings(meetingReq, meeting);
						return saveservice.PatchsaveData(email, res, meeting);

					} else {
						return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to Update");
					}

				} else {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user not Found");
			}

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("An error occurred while updating the certificate: " + e.getMessage());
		}
	}

	public Meeting saveMappings(MeetingRequest meetreq) {
		Meeting meet = new Meeting();
		List<SearchDto> groupinviteeDto = meetreq.getSettings().getGroupinviteeDto();
		List<Muser> usersList = new ArrayList<Muser>();
		List<CourseDetail> courseList = new ArrayList<CourseDetail>();
		List<Batch> batchList = new ArrayList<Batch>();
		if (groupinviteeDto != null) {
			for (SearchDto item : groupinviteeDto) {
				if (item.getType().equals("EMAIL")) {
					// Fetch email by user ID
					Optional<Muser> opuser = muserRepository.findById(item.getId());
					if (opuser.isPresent()) {
						Muser user = opuser.get();
						usersList.add(user);
					}

				}

				if (item.getType().equals("COURSE")) {
					Optional<CourseDetail> opcourse = courseRepo.findById(item.getId());
					if (opcourse.isPresent()) {
						CourseDetail course = opcourse.get();
						courseList.add(course);

					}

				}
				if (item.getType().equals("BATCH")) {
					Optional<Batch> opbatch = batchrepo.findById(item.getId());
					if (opbatch.isPresent()) {
						Batch batch = opbatch.get();
						batchList.add(batch);
					}
				}

			}
		}
		meet.setUsers(usersList);
		meet.setBatches(batchList);
		meet.setCourseDetails(courseList);
		return meet;

	}

	public Meeting PatchMappings(MeetingRequest meetreq, Meeting meeting) {
		List<SearchDto> groupinviteeDto = meetreq.getSettings().getGroupinviteeDto();
		List<Muser> usersList = new ArrayList<Muser>();
		List<CourseDetail> courseList = new ArrayList<CourseDetail>();
		List<Batch> batchList = new ArrayList<Batch>();
		if (groupinviteeDto != null) {
			for (SearchDto item : groupinviteeDto) {
				if (item.getType().equals("EMAIL")) {
					// Fetch email by user ID
					Optional<Muser> opuser = muserRepository.findById(item.getId());
					if (opuser.isPresent()) {
						Muser user = opuser.get();
						usersList.add(user);
					}

				}

				if (item.getType().equals("COURSE")) {
					Optional<CourseDetail> opcourse = courseRepo.findById(item.getId());
					if (opcourse.isPresent()) {
						CourseDetail course = opcourse.get();
						courseList.add(course);

					}

				}
				if (item.getType().equals("BATCH")) {
					Optional<Batch> opbatch = batchrepo.findById(item.getId());
					if (opbatch.isPresent()) {
						Batch batch = opbatch.get();
						batchList.add(batch);
					}
				}

			}
		}
		meeting.getUsers().clear();
		meeting.setUsers(usersList);
		meeting.getBatches().clear();
		meeting.setBatches(batchList);
		meeting.getCourseDetails().clear();
		meeting.setCourseDetails(courseList);
		return meeting;

	}

	private String convertToZoomApiJsonForEdit(MeetingRequest meetingRequest) throws JsonProcessingException {
		Map<String, Object> zoomApiMap = new HashMap<>();

		// Basic fields
		zoomApiMap.put("topic", meetingRequest.getTopic());
		zoomApiMap.put("type", meetingRequest.getType()); // Replace with appropriate value
//		    ZonedDateTime utcTime = meetingRequest.getStartTime().atZone(ZoneOffset.UTC);
//
//		    // Define formatter for UTC without milliseconds
//		    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");
//
//		    // Format the start time as a String
//		    String startTimeString = utcTime.format(formatter);
//
//		    System.out.println("Start time: " + startTimeString);
		DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
		String startTimeString = meetingRequest.getStartTime().format(formatter);
		System.out.println("Starttime" + startTimeString);
		zoomApiMap.put("start_time", startTimeString);

		// Add to zoomApiMap
		zoomApiMap.put("start_time", startTimeString);
		zoomApiMap.put("timezone", meetingRequest.getTimezone());
		// zoomApiMap.put("host_email","akshaya2112001@gmail.com");
		// zoomApiMap.put("pre_schedule", true);
		zoomApiMap.put("agenda", meetingRequest.getAgenda()); // Optional based on Zoom API
		zoomApiMap.put("duration", meetingRequest.getDuration()); // Optional based on Zoom API
//		    zoomApiMap.put("default_password", meetingRequest.isDefaultPassword());
//		    zoomApiMap.put("schedule_for", "akshaya2112001@gmail.com");

		// Recurrence (if present)
		if (meetingRequest.getRecurrence() != null) {
			zoomApiMap.put("recurrence", convertRecurrenceToJson(meetingRequest.getRecurrence()));
		}

		// Settings (if present)
		if (meetingRequest.getSettings() != null) {
			zoomApiMap.put("settings", convertSettingsToJson(meetingRequest.getSettings()));
		}

		// Additional fields based on Zoom API requirements (replace placeholders)
		zoomApiMap.put("password", meetingRequest.getPassword()); // Optional based on Zoom API
//		    zoomApiMap.put("template_id", meetingRequest.getTemplateId()); // Optional based on Zoom API
//		   
		return objectMapper.writeValueAsString(zoomApiMap);
	}

	private String convertToZoomApiJson(MeetingRequest meetingRequest) throws JsonProcessingException {
		Map<String, Object> zoomApiMap = new HashMap<>();

		// Basic fields
		zoomApiMap.put("topic", meetingRequest.getTopic());
		zoomApiMap.put("type", meetingRequest.getType()); // Replace with appropriate value
		DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
		String startTimeString = meetingRequest.getStartTime().format(formatter);
		System.out.println("Starttime" + startTimeString);
		zoomApiMap.put("start_time", startTimeString);
		zoomApiMap.put("timezone", meetingRequest.getTimezone());
		// zoomApiMap.put("host_email","akshaya2112001@gmail.com");
		// zoomApiMap.put("pre_schedule", true);
		zoomApiMap.put("agenda", meetingRequest.getAgenda()); // Optional based on Zoom API
		zoomApiMap.put("duration", meetingRequest.getDuration()); // Optional based on Zoom API
//		    zoomApiMap.put("default_password", meetingRequest.isDefaultPassword());
//		    zoomApiMap.put("schedule_for", "akshaya2112001@gmail.com");

		// Recurrence (if present)
		if (meetingRequest.getRecurrence() != null) {
			zoomApiMap.put("recurrence", convertRecurrenceToJson(meetingRequest.getRecurrence()));
		}

		// Settings (if present)
		if (meetingRequest.getSettings() != null) {
			zoomApiMap.put("settings", convertSettingsToJson(meetingRequest.getSettings()));
		}

		// Additional fields based on Zoom API requirements (replace placeholders)
//		    zoomApiMap.put("password", meetingRequest.getPassword()); // Optional based on Zoom API
//		    zoomApiMap.put("template_id", meetingRequest.getTemplateId()); // Optional based on Zoom API
//		   
		return objectMapper.writeValueAsString(zoomApiMap);
	}

	private Map<String, Object> convertRecurrenceToJson(Recurrence recurrence) {
		Map<String, Object> recurrenceMap = new HashMap<>();
		recurrenceMap.put("type", recurrence.getType());
		recurrenceMap.put("repeat_interval", recurrence.getRepeatInterval());
		recurrenceMap.put("end_date_time", recurrence.getEndDateTime());
		recurrenceMap.put("end_times", recurrence.getEndTimes());
		if (recurrence.getMonthlyDay() == 0) {
			recurrenceMap.put("monthly_day", null);
			recurrenceMap.put("monthly_week", recurrence.getMonthlyWeek());
			recurrenceMap.put("monthly_week_day", recurrence.getMonthlyWeekDay());
		} else {
			recurrenceMap.put("monthly_day", recurrence.getMonthlyDay());
		}
		recurrenceMap.put("weekly_days", recurrence.getWeeklyDays());

		return recurrenceMap;
	}

	private Map<String, Object> convertSettingsToJson(Settings settings) {
		Map<String, Object> settingsMap = new HashMap<>();

		settingsMap.put("host_video", settings.isHostVideo());
		settingsMap.put("participant_video", settings.isParticipantVideo());
		settingsMap.put("mute_upon_entry", settings.isMuteUponEntry());
		// settingsMap.put("waiting_room", settings.isWaitingRoom());
		settingsMap.put("audio", settings.getAudio());
		// settingsMap.put("audio_conference_info", settings.getAudioConferenceInfo());
		settingsMap.put("auto_recording", settings.getAutoRecording());
		// settingsMap.put("calendar_type", settings.getCalendarType());
		// settingsMap.put("close_registration", settings.isCloseRegistration());
		// settingsMap.put("contact_email", settings.getContactEmail());
		// settingsMap.put("contact_name", settings.getContactName());
		settingsMap.put("email_notification", settings.isEmailNotification());
//		    settingsMap.put("encryption_type", settings.getEncryptionType());
		// settingsMap.put("focus_mode", settings.isFocusMode());
//		    settingsMap.put("global_dial_in_countries", settings.getGlobalDialInCountries());
		// settingsMap.put("jbh_time", settings.getJbhTime());
		settingsMap.put("join_before_host", settings.isJoinBeforeHost());
		// settingsMap.put("meeting_authentication",
		// settings.isMeetingAuthentication());
		settingsMap.put("mute_upon_entry", settings.isMuteUponEntry());
		settingsMap.put("participant_video", settings.isParticipantVideo());
//		    settingsMap.put("private_meeting", settings.isPrivateMeeting());
		settingsMap.put("registrants_confirmation_email", true);
		settingsMap.put("registrants_email_notification", true);
//		    settingsMap.put("registration_type", settings.getRegistrationType());
//		    settingsMap.put("registration_type",2);
//		    settingsMap.put("show_share_button", settings.isShowShareButton());
//		    settingsMap.put("use_pmi", settings.isUsePmi());
		settingsMap.put("waiting_room", settings.isWaitingRoom());
//		    settingsMap.put("watermark", settings.isWatermark());
//		    settingsMap.put("host_save_video_order", settings.isHostSaveVideoOrder());
//		    settingsMap.put("alternative_host_update_polls", settings.isAlternativeHostUpdatePolls());
//		    settingsMap.put("internal_meeting", settings.isInternalMeeting());
//		    settingsMap.put("participant_focused_meeting", settings.isParticipantFocusedMeeting());
		settingsMap.put("push_change_to_calendar", settings.isPushChangeToCalendar());
//		    settingsMap.put("auto_start_meeting_summary", settings.isAutoStartMeetingSummary());
//		    settingsMap.put("auto_start_ai_companion_questions", settings.isAutoStartAiCompanionQuestions());
//		    settingsMap.put("device_testing", settings.isDeviceTesting());
		// settingsMap.put("alternative_hosts", settings.getAlternativeHosts());
		// settingsMap.put("aalternative_hosts_email_notification", true);

//		    if (settings.getAdditionalDataCenterRegions() != null) {
//		       // settingsMap.put("additional_data_center_regions", settings.getAdditionalDataCenterRegions());
//		    }
//		    if (settings.getAuthenticationException() != null) {
//		       // settingsMap.put("authentication_exception", convertAuthenticationExceptionsToJson(settings.getAuthenticationException()));
//		    }
		if (settings.getMeetingInvitees() != null) {
			settingsMap.put("meeting_invitees", convertMeetingInviteesToJson(settings.getGroupinviteeDto()));
		}

		return settingsMap;
	}
//		private List<Map<String, Object>> convertAuthenticationExceptionsToJson(List<AuthenticationException> authenticationExceptions) {
//		    List<Map<String, Object>> exceptionsList = new ArrayList<>();
//		    for (AuthenticationException exception : authenticationExceptions) {
//		        Map<String, Object> exceptionMap = new HashMap<>();
//		        exceptionMap.put("email", exception.getEmail());
//		        exceptionMap.put("name", exception.getName());
//		        exceptionsList.add(exceptionMap);
//		    }
//		    return exceptionsList;
//		}

//		private List<Map<String, Object>> convertMeetingInviteesToJson(List<MeetingInvitee> meetingInvitees) {
//		    List<Map<String, Object>> inviteesList = new ArrayList<>();
//		    for (MeetingInvitee invitee : meetingInvitees) {
//		        Map<String, Object> inviteeMap = new HashMap<>();
//		        inviteeMap.put("email", invitee.getEmail());
//		        inviteesList.add(inviteeMap);
//		    }
//		    return inviteesList;
//		}

	private List<Map<String, Object>> convertMeetingInviteesToJson(List<SearchDto> groupinviteeDto) {
		// Using a Set to store unique invitees based on email
		Set<Map<String, Object>> inviteesSet = new HashSet<>();
		if (groupinviteeDto == null) {
			return new ArrayList<Map<String, Object>>();
		}
		for (SearchDto item : groupinviteeDto) {
			if (item.getType().equals("EMAIL")) {
				// Fetch email by user ID
				String email = muserRepository.FindEmailByuserId(item.getId());

				// Create a map for the invitee and add it to the set
				Map<String, Object> inviteeMap = new HashMap<>();
				inviteeMap.put("email", email);
				inviteesSet.add(inviteeMap); // Set will ensure uniqueness automatically
			}

			if (item.getType().equals("COURSE")) {
				// Fetch emails by course ID
				List<String> courseInvitees = courseRepo.findInviteesByCourseId(item.getId());

				// Convert the course invitees (List<Map<String, String>>) to List<Map<String,
				// Object>> to match the desired format
				for (String email : courseInvitees) {

					// Create a map for the course invitee and add it to the set
					Map<String, Object> inviteeMap = new HashMap<>();
					inviteeMap.put("email", email);
					inviteesSet.add(inviteeMap); // Set will ensure uniqueness automatically
				}
				List<String> trainerInvitees = courseRepo.findTrainerInviteesByCourseId(item.getId());
				for (String email : trainerInvitees) {

					// Create a map for the course invitee and add it to the set
					Map<String, Object> inviteeMap = new HashMap<>();
					inviteeMap.put("email", email);
					inviteesSet.add(inviteeMap); // Set will ensure uniqueness automatically
				}
			}
			if (item.getType().equals("BATCH")) {
				List<String> trainers = batchrepo.findtrainersByBatchId(item.getId());
				List<String> users = batchrepo.findusersByBatchId(item.getId());
				if (users != null) {
					for (String email : users) {

						// Create a map for the course invitee and add it to the set
						Map<String, Object> inviteeMap = new HashMap<>();
						inviteeMap.put("email", email);
						inviteesSet.add(inviteeMap); // Set will ensure uniqueness automatically
					}
				}
				if (trainers != null) {
					for (String email : trainers) {

						// Create a map for the course invitee and add it to the set
						Map<String, Object> inviteeMap = new HashMap<>();
						inviteeMap.put("email", email);
						inviteesSet.add(inviteeMap); // Set will ensure uniqueness automatically
					}
				}
			}
		}

		return new ArrayList<>(inviteesSet);
	}

	public ResponseEntity<?> getMetting(String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				opuser.get();
				List<calenderDto> meetingDetailsList = new ArrayList<>();
				List<ZoomMeetingInvitee> invitees = inviteerepo.findByEmail(email);
				for (ZoomMeetingInvitee invitee : invitees) {
					ZoomSettings settings = invitee.getZoomSettings();
					List<calenderDto> items = meetrepo.findMeetingsForRecursive(settings);
					if (items != null && !items.isEmpty()) {
						meetingDetailsList.addAll(items);
					}
				}
				return ResponseEntity.ok(meetingDetailsList);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {

			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@Transactional
	public ResponseEntity<?> DeleteMeet(Long MeetingId, String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				Optional<Meeting> optionalMeeting = meetrepo.FindByMeetingId(MeetingId);
				if (optionalMeeting.isEmpty()) {
					return ResponseEntity.status(HttpStatus.NO_CONTENT).body("Meeting Not Found");
				}
				Meeting meeting = optionalMeeting.get();
				// Delete the Zoom meeting using the Zoom API
				String accessToken = zoomTokenService.getAccessToken(user.getInstitutionName());

				boolean res = zoomMethod.deleteMeeting(MeetingId, accessToken);
				if (res) {
					// Meeting deleted successfully
					Long notificationId = meeting.getNotificationId();
					notiuser.deleteByNotificationId(notificationId);
					notidetail.deleteByNotifyId(notificationId);
					occurancesRepo.deleteByMeetingId(MeetingId);
					meetrepo.delete(meeting); // Delete from your database
					return ResponseEntity.ok("Meeting deleted successfully");
				} else {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
				}

			} else {
				System.out.println("user unauthorized");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> getMeetDetailsForEdit(String token, Long MeetingId) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				opuser.get();
				Optional<Meeting> optionalMeeting = meetrepo.FindByMeetingId(MeetingId);
				if (optionalMeeting.isPresent()) {
					Meeting meeting = optionalMeeting.get();
					MeetingRequest meettosend = new MeetingRequest();
					meettosend.setPassword(meeting.getPassword());
					meettosend.setTopic(meeting.getTopic());
					meettosend.setAgenda(meeting.getAgenda());
					meettosend.setDuration(meeting.getDuration());
					List<SearchDto> invitees = new ArrayList<SearchDto>();
					List<Batch> batches = meeting.getBatches();
					for (Batch batch : batches) {
						SearchDto dto = new SearchDto();
						dto.setId(batch.getId());
						dto.setName(batch.getBatchTitle());
						dto.setType("BATCH");
						invitees.add(dto);
					}
					List<CourseDetail> courses = meeting.getCourseDetails();
					for (CourseDetail course : courses) {
						SearchDto dto = new SearchDto();
						dto.setId(course.getCourseId());
						dto.setName(course.getCourseName());
						dto.setType("COURSE");
						invitees.add(dto);
					}
					List<Muser> users = meeting.getUsers();
					for (Muser user : users) {
						SearchDto dto = new SearchDto();
						dto.setId(user.getUserId());
						dto.setName(user.getUsername());
						dto.setType("USER");
						invitees.add(dto);
					}

					if (meeting.getStartTime() != null) {
						String utcDateString = meeting.getStartTime();
						meettosend.setStartingTime(utcDateString);
						OffsetDateTime offsetDateTime = OffsetDateTime.parse(utcDateString,
								DateTimeFormatter.ISO_OFFSET_DATE_TIME);
						LocalDateTime localDateTime = offsetDateTime.toLocalDateTime();
						meettosend.setStartTime(localDateTime);
					}
					meettosend.setTimezone(meeting.getTimezone());
					meettosend.setType(meeting.getType());
					if (meeting.getType() == 8) {
						Recurrence rec = new Recurrence();
						Recurrenceclass recurrenceSource = meeting.getReccurance();

						if (recurrenceSource != null) {
							rec.setEndDateTime(recurrenceSource.getEndDateTime());
							rec.setEndTimes(recurrenceSource.getEndTimes());
							rec.setMonthlyDay(
									recurrenceSource.getMonthlyDay() != null ? recurrenceSource.getMonthlyDay() : 0);
							rec.setMonthlyWeek(
									recurrenceSource.getMonthlyWeek() != null ? recurrenceSource.getMonthlyWeek() : 0);

							rec.setMonthlyWeekDay(
									recurrenceSource.getMonthlyWeekDay() != null ? recurrenceSource.getMonthlyWeekDay()
											: 0);

							rec.setRepeatInterval(
									recurrenceSource.getRepeatInterval() != null ? recurrenceSource.getRepeatInterval()
											: 1);

							rec.setType(recurrenceSource.getType() != null ? recurrenceSource.getType() : 0);

							rec.setWeeklyDays(
									recurrenceSource.getWeeklyDays() != null ? recurrenceSource.getWeeklyDays() : "");
						}
						meettosend.setRecurrence(rec);
					}
					ZoomSettings settings = meeting.getSettings();
					Settings set = new Settings();
					set.setAudio(settings.getAudio());
					set.setAutoRecording(settings.getAutoRecording());
					set.setHostVideo(settings.isHostVideo());
					set.setMuteUponEntry(settings.isMuteUponEntry());
					set.setJoinBeforeHost(settings.isJoinBeforeHost());
					set.setEmailNotification(settings.isEmailNotification());
					set.setMuteUponEntry(settings.isMuteUponEntry());
					set.setParticipantVideo(settings.isParticipantVideo());
					set.setPushChangeToCalendar(settings.isPushChangeToCalendar());
					set.setGroupinviteeDto(invitees);
					if (settings.getWaitingRoom() != null) {
						set.setWaitingRoom(settings.getWaitingRoom());
					} else {
						set.setWaitingRoom(false);
					}
//	  	           List<ZoomMeetingInvitee> invitees=meeting.getSettings().getMeetingInvitees();
//	  	         List<MeetingInvitee> newInvitees = new ArrayList<>();
//	  	           for(ZoomMeetingInvitee invitee:invitees) {
//	  	        	 MeetingInvitee newInvite=new MeetingInvitee();
//	  	        	 newInvite.setEmail(invitee.getEmail());
//	  	        	 newInvitees.add(newInvite);
//	  	           }
//	  	           set.setMeetingInvitees(newInvitees);

					meettosend.setSettings(set);
					return ResponseEntity.ok(meettosend);
				} else {
					return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User Not Found");

			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}

	public ResponseEntity<?> getVirtualClass(String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			String institutionName = muserRepository.findinstitutionByEmail(email);
			if (institutionName == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("institution not found");
			}
			String joinurl = virtualrepo.getJoinUrlByInstitutionName(institutionName);
			return ResponseEntity.ok(joinurl);
		} catch (Exception e) {
			logger.error("errror getting virtualClass" + e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
}
