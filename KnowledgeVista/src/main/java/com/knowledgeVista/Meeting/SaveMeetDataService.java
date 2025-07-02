package com.knowledgeVista.Meeting;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowledgeVista.Email.EmailService;
import com.knowledgeVista.Meeting.zoomclass.Meeting;
import com.knowledgeVista.Meeting.zoomclass.Occurrences;
import com.knowledgeVista.Meeting.zoomclass.Recurrenceclass;
import com.knowledgeVista.Meeting.zoomclass.VirtualmeetingMap;
import com.knowledgeVista.Meeting.zoomclass.ZoomMeetingInvitee;
import com.knowledgeVista.Meeting.zoomclass.ZoomSettings;
import com.knowledgeVista.Meeting.zoomclass.repo.InviteeRepo;
import com.knowledgeVista.Meeting.zoomclass.repo.Meetrepo;
import com.knowledgeVista.Meeting.zoomclass.repo.OccurancesRepo;
import com.knowledgeVista.Meeting.zoomclass.repo.Recurrenceclassrepo;
import com.knowledgeVista.Meeting.zoomclass.repo.VirtualmeetmapRepo;
import com.knowledgeVista.Meeting.zoomclass.repo.ZoomsettingRepo;
import com.knowledgeVista.Notification.Repositories.NotificationDetailsRepo;
import com.knowledgeVista.Notification.Repositories.NotificationUserRepo;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.zoomJar.ZoomMethods;

@Service
public class SaveMeetDataService {
	@Autowired
	private Meetrepo meetrepo;
	@Autowired
	private ZoomsettingRepo settingrepo;
	@Autowired
	private InviteeRepo inviteRepo;
	@Autowired
	private NotificationService notiservice;
	@Autowired
	private NotificationDetailsRepo notidetail;
	@Autowired
	private OccurancesRepo occurancesRepo;
	@Autowired
	private Recurrenceclassrepo reccrepo;
	@Autowired
	private EmailService emailservice;
	@Autowired
	private MuserRepositories muserrepo;
	@Autowired
	private VirtualmeetmapRepo virtualMapRepo;
	@Autowired
	private ZoomTokenService zoomTokenService;
	@Autowired
	private ZoomMethods zoomMethod;
	@Autowired
	private NotificationUserRepo notiuser;

	private static final Logger logger = LoggerFactory.getLogger(SaveMeetDataService.class);

	private void extractMeetingDetails(JsonNode rootNode, Meeting meeting, String email) {
		if (rootNode.has("uuid"))
			meeting.setUuid(rootNode.get("uuid").asText());
		if (rootNode.has("type"))
			meeting.setType(rootNode.get("type").asInt());
		if (rootNode.has("id"))
			meeting.setMeetingId(rootNode.get("id").asLong());
		if (rootNode.has("agenda"))
			meeting.setAgenda(rootNode.get("agenda").asText());
		if (rootNode.has("host_email"))
			meeting.setHostEmail(rootNode.get("host_email").asText());
		if (rootNode.has("start_url"))
			meeting.setStartUrl(rootNode.get("start_url").asText());
		if (rootNode.has("join_url"))
			meeting.setJoinUrl(rootNode.get("join_url").asText());
		if (rootNode.has("password"))
			meeting.setPassword(rootNode.get("password").asText());
		if (rootNode.has("topic"))
			meeting.setTopic(rootNode.get("topic").asText());
		if (rootNode.has("duration"))
			meeting.setDuration(rootNode.get("duration").asInt());
		if (rootNode.has("start_time")) {
			String startTimeStr = rootNode.get("start_time").asText();
			System.out.println("startTime==" + startTimeStr);
			meeting.setStartTime(startTimeStr);
		} else {
			System.out.println("no starttime");
			if (rootNode.has("occurrences")) {
				JsonNode occurrencesNode = rootNode.get("occurrences");

				// If occurrencesNode is an array and has at least one element
				if (occurrencesNode.isArray() && occurrencesNode.size() > 0) {
					JsonNode firstOccurrence = occurrencesNode.get(0);

					// Extract start time from the first occurrence
					String firstOccurrenceStartTime = firstOccurrence.get("start_time").asText();
					System.out.println("Using start time from first occurrence: " + firstOccurrenceStartTime);

					meeting.setStartTime(firstOccurrenceStartTime);
				}
			}
		}
		if (rootNode.has("timezone"))
			meeting.setTimezone(rootNode.get("timezone").asText());
		meeting.setCreatedBy(email);
	}

	public ResponseEntity<?> PatchsaveData(String email, String jsonString, Meeting meeting) {
		try {
			ObjectMapper mapper = new ObjectMapper();
			JsonNode rootNode = mapper.readTree(jsonString);
			// Update meeting details
			extractMeetingDetails(rootNode, meeting, email); // Ensure this method updates the passed meeting object
			meeting.setCreatedBy(email);

			// Update occurrences
			// Update occurrences
			if (rootNode.has("occurrences")) {
				JsonNode occurrencesNode = rootNode.get("occurrences");

				// Clear existing occurrences
				meeting.getOccurances().clear();

				if (occurrencesNode.isArray()) {
					for (JsonNode occurrenceNode : occurrencesNode) {
						// ... (rest of the occurrence processing logic)

						Long occurrenceId = occurrenceNode.get("occurrence_id").asLong();
						String startTimeStr = occurrenceNode.get("start_time").asText();
						String status = occurrenceNode.get("status").asText();
						Integer duration = occurrenceNode.get("duration").asInt();

						Occurrences newOccurrence = new Occurrences();
						newOccurrence.setDuration(duration);
						newOccurrence.setOccurrence_id(occurrenceId);
						newOccurrence.setStart_time(startTimeStr);
						newOccurrence.setStatus(status);
						newOccurrence.setMeeting(meeting);

						meeting.getOccurances().add(newOccurrence);
					}
				}
			}

			// Update recurrence
			if (rootNode.has("recurrence")) {
				Recurrenceclass rec = meeting.getReccurance();
				if (rec == null) {
					rec = new Recurrenceclass();
					meeting.setReccurance(rec);
				}

				JsonNode recNode = rootNode.get("recurrence");
				rec.setEndDateTime(recNode.has("end_date_time") ? recNode.get("end_date_time").asText() : null);
				rec.setEndTimes(recNode.has("end_times") ? recNode.get("end_times").asInt() : null);
				rec.setMonthlyDay(recNode.has("monthly_day") ? recNode.get("monthly_day").asInt() : null);
				rec.setMonthlyWeek(recNode.has("monthly_week") ? recNode.get("monthly_week").asInt() : null);
				rec.setMonthlyWeekDay(recNode.has("monthly_week_day") ? recNode.get("monthly_week_day").asInt() : null);
				rec.setRepeatInterval(recNode.has("repeat_interval") ? recNode.get("repeat_interval").asInt() : null);
				rec.setType(recNode.has("type") ? recNode.get("type").asInt() : null);
				rec.setWeeklyDays(recNode.has("weekly_days") ? recNode.get("weekly_days").asText() : null);

				reccrepo.save(rec);
			}

			// Update settings
			if (rootNode.has("settings")) {
				ZoomSettings settings = meeting.getSettings();
				if (settings == null) {
					settings = new ZoomSettings();
					meeting.setSettings(settings);
				}

				JsonNode settingsNode = rootNode.get("settings");
				settings.setAudio(settingsNode.get("audio").asText());
				settings.setAutoRecording(settingsNode.get("auto_recording").asText());
				settings.setEmailNotification(settingsNode.get("email_notification").asBoolean());
				settings.setHostVideo(settingsNode.get("host_video").asBoolean());
				settings.setJoinBeforeHost(settingsNode.get("join_before_host").asBoolean());
				settings.setMuteUponEntry(settingsNode.get("mute_upon_entry").asBoolean());
				settings.setWaitingRoom(settingsNode.get("waiting_room").asBoolean());

				// Clear existing invitees
				if (settings.getMeetingInvitees() != null) {
					settings.getMeetingInvitees().clear();
				}

				Set<String> existingEmails = new HashSet<>();

				List<ZoomMeetingInvitee> inviteesToSave = new ArrayList<>();
				ZoomMeetingInvitee admin = new ZoomMeetingInvitee();
				admin.setEmail(email);
				admin.setZoomSettings(settings);
				inviteesToSave.add(admin);
				existingEmails.add(email);
				if (rootNode.get("settings").has("meeting_invitees")) {

					JsonNode inviteesNode = rootNode.get("settings").get("meeting_invitees");
					if (inviteesNode.isArray()) {
						for (JsonNode inviteeNode : inviteesNode) {
							if (inviteeNode.has("email")) {
								String inviteeEmail = inviteeNode.get("email").asText().trim();
								if (!inviteeEmail.isEmpty() && !existingEmails.contains(inviteeEmail)) {
									ZoomMeetingInvitee invitee = new ZoomMeetingInvitee();
									invitee.setEmail(inviteeEmail);
									invitee.setZoomSettings(settings);
									inviteesToSave.add(invitee);
									existingEmails.add(inviteeEmail);
								}
							}
						}
					}
				}
				meeting.setSettings(settings);
				meeting.getSettings().getMeetingInvitees().addAll(inviteesToSave);
				meetrepo.save(meeting);

				if (!inviteesToSave.isEmpty()) {
					Long notid = notiservice.createNotification("MeetingUpdated", "system",
							"Meeting Updated to " + meeting.getStartTime() + " Click To Join the meeting", "System",
							meeting.getTopic(), meeting.getJoinUrl());
					meeting.setNotificationId(notid);
					if (notid != null) {
						notiservice.SpecificCreateNotificationusingEmail(notid, new ArrayList<>(existingEmails));
					}
					List<String> bcc = null;
					List<String> cc = null;
					String institutionname = muserrepo.findinstitutionByEmail(email);
					String body = String.format(
							"Meeting Updated: %s<br>" + "Password: %s<br>" + "Time: %s<br>" + "TimeZone: %s<br>"
									+ "Join URL: <a href=\"%s\" target=\"_blank\" rel=\"noopener noreferrer\">%s</a>",
							meeting.getTopic(), meeting.getPassword(), meeting.getStartTime(), meeting.getTimezone(),
							meeting.getJoinUrl(), meeting.getJoinUrl());

					if (institutionname != null && !institutionname.isEmpty()) {
						try {
							emailservice.sendHtmlEmailAsync(institutionname, new ArrayList<>(existingEmails), cc, bcc,
									meeting.getTopic(), body);
						} catch (Exception e) {
							logger.error("errorSending Mail" + e);
						}
					}

				}

			}
			meetrepo.save(meeting);
			return ResponseEntity.ok("Meeting Saved ");

		} catch (Exception e) {
			e.printStackTrace();
			logger.error("Error updating meeting: ", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	public ResponseEntity<?> saveMeetData(String jsonString, String email, Meeting meeting) {
		try {
			ObjectMapper mapper = new ObjectMapper();
			System.out.println("json" + jsonString);
			JsonNode rootNode = mapper.readTree(jsonString);
			meeting = extractMeetingDetails(rootNode, email, meeting);
			if (rootNode.has("occurrences")) {
				JsonNode occurrencesNode = rootNode.get("occurrences");
				List<Occurrences> occurrencesList = new ArrayList<>();
				if (occurrencesNode.isArray()) {
					for (JsonNode occurrenceNode : occurrencesNode) {
						Long occuranceid = occurrenceNode.get("occurrence_id").asLong();
						String startTimeStr = occurrenceNode.get("start_time").asText();
						String status = occurrenceNode.get("status").asText();
						Integer duration = occurrenceNode.get("duration").asInt();
						Occurrences occurance = new Occurrences();
						occurance.setDuration(duration);
						occurance.setOccurrence_id(occuranceid);
						occurance.setStart_time(startTimeStr);
						occurance.setStatus(status);
						Occurrences occ = occurancesRepo.save(occurance);
						;
						occurrencesList.add(occ);
					}
					meeting.setOccurances(occurrencesList);
				}
				if (rootNode.has("recurrence")) {
					Recurrenceclass rec = new Recurrenceclass();
					JsonNode RecNode = rootNode.get("recurrence");
					rec.setEndDateTime(RecNode.has("end_date_time") ? RecNode.get("end_date_time").asText() : null);
					rec.setEndTimes(RecNode.has("end_times") ? RecNode.get("end_times").asInt() : null);
					rec.setMonthlyDay(RecNode.has("monthly_day") ? RecNode.get("monthly_day").asInt() : null);
					rec.setMonthlyWeek(RecNode.has("monthly_week") ? RecNode.get("monthly_week").asInt() : null);
					rec.setMonthlyWeekDay(
							RecNode.has("monthly_week_day") ? RecNode.get("monthly_week_day").asInt() : null);
					rec.setRepeatInterval(
							RecNode.has("repeat_interval") ? RecNode.get("repeat_interval").asInt() : null);
					rec.setType(RecNode.has("type") ? RecNode.get("type").asInt() : null);
					rec.setWeeklyDays(RecNode.has("weekly_days") ? RecNode.get("weekly_days").asText() : null);
					Recurrenceclass recu = reccrepo.save(rec);
					meeting.setReccurance(recu);

				}
				if (rootNode.has("settings")) {
					ZoomSettings settings = extractSettings(rootNode.get("settings"));
					settingrepo.save(settings);

					List<ZoomMeetingInvitee> invitees = extractInvitees(rootNode.get("settings"), email, settings,
							meeting);
					if (!invitees.isEmpty()) {
						inviteRepo.saveAll(invitees);
						settings.setMeetingInvitees(invitees);
					}
					meeting.setSettings(settings);
				}

				Meeting meet = meetrepo.save(meeting);
				List<Occurrences> occurrences = meet.getOccurances();
				if (occurrences != null && !occurrences.isEmpty()) {
					for (Occurrences occurrence : occurrences) {
						occurrence.setMeeting(meet); // Ensure each occurrence is linked to the meeting
					}
				}
				occurancesRepo.saveAll(occurrences);
				return ResponseEntity.ok("saved Successfully");

			} else {
				if (rootNode.has("settings")) {
					ZoomSettings settings = extractSettings(rootNode.get("settings"));
					settingrepo.save(settings);

					List<ZoomMeetingInvitee> invitees = extractInvitees(rootNode.get("settings"), email, settings,
							meeting);
					if (!invitees.isEmpty()) {
						inviteRepo.saveAll(invitees);
						settings.setMeetingInvitees(invitees);
					}
					meeting.setSettings(settings);
				}

				Meeting saved = meetrepo.save(meeting);
				if (saved.getType().equals(3)) {
					SaveVirtualMeeting(email, meeting);
				}
				return ResponseEntity.ok("saved Successfully");

			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private Meeting extractMeetingDetails(JsonNode rootNode, String email, Meeting meeting) {

		if (rootNode.has("uuid"))
			meeting.setUuid(rootNode.get("uuid").asText());
		if (rootNode.has("type"))
			meeting.setType(rootNode.get("type").asInt());
		if (rootNode.has("id"))
			meeting.setMeetingId(rootNode.get("id").asLong());
		if (rootNode.has("agenda"))
			meeting.setAgenda(rootNode.get("agenda").asText());
		if (rootNode.has("host_email"))
			meeting.setHostEmail(rootNode.get("host_email").asText());
		if (rootNode.has("start_url"))
			meeting.setStartUrl(rootNode.get("start_url").asText());
		if (rootNode.has("join_url"))
			meeting.setJoinUrl(rootNode.get("join_url").asText());
		if (rootNode.has("password"))
			meeting.setPassword(rootNode.get("password").asText());
		if (rootNode.has("topic"))
			meeting.setTopic(rootNode.get("topic").asText());
		if (rootNode.has("duration"))
			meeting.setDuration(rootNode.get("duration").asInt());
		if (rootNode.has("start_time")) {
			String startTimeStr = rootNode.get("start_time").asText();
			System.out.println("startTime==" + startTimeStr);
			meeting.setStartTime(startTimeStr);
		} else {
			System.out.println("no starttime");
			if (rootNode.has("occurrences")) {
				JsonNode occurrencesNode = rootNode.get("occurrences");

				// If occurrencesNode is an array and has at least one element
				if (occurrencesNode.isArray() && occurrencesNode.size() > 0) {
					JsonNode firstOccurrence = occurrencesNode.get(0);

					// Extract start time from the first occurrence
					String firstOccurrenceStartTime = firstOccurrence.get("start_time").asText();
					System.out.println("Using start time from first occurrence: " + firstOccurrenceStartTime);

					meeting.setStartTime(firstOccurrenceStartTime);
				}
			}
		}

		if (rootNode.has("timezone"))
			meeting.setTimezone(rootNode.get("timezone").asText());
		meeting.setCreatedBy(email);
		return meeting;
	}

	private ZoomSettings extractSettings(JsonNode settingsNode) {
		ZoomSettings settings = new ZoomSettings();
		if (settingsNode.has("audio"))
			settings.setAudio(settingsNode.get("audio").asText());
		if (settingsNode.has("auto_recording"))
			settings.setAutoRecording(settingsNode.get("auto_recording").asText());
		if (settingsNode.has("email_notification"))
			settings.setEmailNotification(settingsNode.get("email_notification").asBoolean());
		if (settingsNode.has("host_video"))
			settings.setHostVideo(settingsNode.get("host_video").asBoolean());
		if (settingsNode.has("join_before_host"))
			settings.setJoinBeforeHost(settingsNode.get("join_before_host").asBoolean());
		if (settingsNode.has("mute_upon_entry"))
			settings.setMuteUponEntry(settingsNode.get("mute_upon_entry").asBoolean());
		if (settingsNode.has("waiting_room"))
			settings.setWaitingRoom(settingsNode.get("waiting_room").asBoolean());
		// Add extraction for other settings as needed
		return settings;
	}

	private List<ZoomMeetingInvitee> extractInvitees(JsonNode settingsNode, String email, ZoomSettings settings,
			Meeting meeting) {
		List<ZoomMeetingInvitee> invitees = new ArrayList<>();
		ZoomMeetingInvitee admin = new ZoomMeetingInvitee();
		List<String> notificationEmails = new ArrayList<>();
		admin.setEmail(email);
		admin.setZoomSettings(settings);
		notificationEmails.add(email);
		invitees.add(admin);
		if (settingsNode.has("meeting_invitees")) {
			JsonNode inviteesNode = settingsNode.get("meeting_invitees");
			if (inviteesNode.isArray()) {
				for (JsonNode inviteeNode : inviteesNode) {
					if (inviteeNode.has("email")) {
						String inviteeEmail = inviteeNode.get("email").asText();
						if (inviteeEmail != null && !inviteeEmail.trim().isEmpty()) {
							ZoomMeetingInvitee invitee = new ZoomMeetingInvitee();
							invitee.setEmail(inviteeEmail);
							invitee.setZoomSettings(settings);
							notificationEmails.add(inviteeEmail);
							invitees.add(invitee);
						}
					}
				}
			}
		}

		boolean emailExists = invitees.stream().anyMatch(invitee -> invitee.getEmail().equalsIgnoreCase(email));
		if (!emailExists) {
			ZoomMeetingInvitee parameterInvitee = new ZoomMeetingInvitee();
			parameterInvitee.setEmail(email);
			parameterInvitee.setZoomSettings(settings);
			invitees.add(parameterInvitee);
			notificationEmails.add(email);
		}

		if (!notificationEmails.isEmpty()) {
			Long notificationId = notiservice.createNotification("MeetingScheduled", "system",
					"New Meeting Scheduled on " + meeting.getStartTime() + " Click to join the meeting", "System",
					meeting.getTopic(), meeting.getJoinUrl());
			meeting.setNotificationId(notificationId);
			notifiemails(email, notificationId, notificationEmails, meeting);
		}

		return invitees;
	}

	private void notifiemails(String email, Long notificationId, List<String> notificationEmails, Meeting meeting) {
		if (notificationId != null) {
			notiservice.SpecificCreateNotificationusingEmail(notificationId, notificationEmails);
		}

		// mail sending..
		List<String> bcc = null;
		List<String> cc = null;
		String institutionname = muserrepo.findinstitutionByEmail(email);
		String body = String.format(
				"Meeting Created: %s<br>" + "Password: %s<br>" + "Time: %s<br>" + "TimeZone: %s<br>"
						+ "Join URL: <a href=\"%s\" target=\"_blank\" rel=\"noopener noreferrer\">%s</a>",
				meeting.getTopic(), meeting.getPassword(), meeting.getStartTime(), meeting.getTimezone(),
				meeting.getJoinUrl(), meeting.getJoinUrl());

		if (institutionname != null && !institutionname.isEmpty()) {
			try {
				emailservice.sendHtmlEmailAsync(institutionname, notificationEmails, cc, bcc, institutionname, body);
			} catch (Exception e) {
				logger.error("errorSending Mail" + e);
			}

		}

	}

	@Transactional
	private void DeleteMeet(Meeting meeting, String instituionName) {
		try { // Delete the Zoom meeting using the Zoom API
			String accessToken = zoomTokenService.getAccessToken(instituionName);
			boolean res = zoomMethod.deleteMeeting(meeting.getMeetingId(), accessToken);
			if (res) {
				// Meeting deleted successfully
				Long notificationId = meeting.getNotificationId();
				notiuser.deleteByNotificationId(notificationId);
				notidetail.deleteByNotifyId(notificationId);
				meetrepo.delete(meeting); // Delete from your database
				System.out.println("deleted");
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
		}
	}

	private void SaveVirtualMeeting(String email, Meeting meet) {
		try {
			String institutionName = muserrepo.findinstitutionByEmail(email);
			Optional<VirtualmeetingMap> opmap = virtualMapRepo.findByinstitutionName(institutionName);
			if (opmap.isPresent()) {
				VirtualmeetingMap map = opmap.get();
				Meeting oldmeet = map.getMeeting();
				map.setMeeting(meet);
				virtualMapRepo.save(map);
				DeleteMeet(oldmeet, institutionName);
				System.out.println("savingOld");
			} else {
				VirtualmeetingMap newmap = new VirtualmeetingMap();
				newmap.setInstitutionName(institutionName);
				newmap.setMeeting(meet);
				virtualMapRepo.save(newmap);
				System.out.println("savingNew");
			}
		} catch (Exception e) {
			// TODO: handle exception
			logger.error("error saving virtualMap" + e);
		}
	}
}
