package com.knowledgeVista.Meeting.zoomclass.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Meeting.zoomclass.Meeting;
import com.knowledgeVista.Meeting.zoomclass.ZoomSettings;
import com.knowledgeVista.Meeting.zoomclass.calenderDto;

@Repository
public interface Meetrepo extends JpaRepository<Meeting, Long> {

//	@Query("SELECT NEW com.knowledgeVista.Meeting.zoomclass.calenderDto(u.MeetingId,u.topic, u.JoinUrl, u.startTime,u.duration) FROM Meeting u WHERE u.settings = ?1")
//	calenderDto findByZoomsettings(ZoomSettings settings);

	@Query("SELECT NEW com.knowledgeVista.Meeting.zoomclass.calenderDto(u.MeetingId, u.topic, u.JoinUrl, "
			+ "CASE WHEN u.type = 8 THEN o.start_time ELSE u.startTime END, "
			+ "CASE WHEN u.type = 8 THEN o.duration ELSE u.duration END) " + "FROM Meeting u "
			+ "LEFT JOIN u.occurances o " + "WHERE u.settings = ?1")
	List<calenderDto> findMeetingsForRecursive(ZoomSettings settings);

	@Query("SELECT NEW com.knowledgeVista.Meeting.zoomclass.calenderDto(u.MeetingId, u.topic, u.JoinUrl, "
			+ "CASE WHEN u.type = 8 THEN o.start_time ELSE u.startTime END, "
			+ "CASE WHEN u.type = 8 THEN o.duration ELSE u.duration END) " + "FROM Meeting u "
			+ "LEFT JOIN u.occurances o " + "WHERE u.settings = ?1 AND "
			+ "(CASE WHEN u.type = 8 THEN o.start_time ELSE u.startTime END) LIKE CONCAT(?2, '%')")
	List<calenderDto> findMeetingsForRecursiveWithDate(ZoomSettings settings, String date);

	@Query("SELECT u From Meeting u WHERE u.MeetingId=?1")
	Optional<Meeting> FindByMeetingId(Long MeetingId);

	@Query("SELECT u.JoinUrl From Meeting u WHERE u.MeetingId=?1")
	String FindJoinUrlByMeetingId(Long MeetingId);

	@Query("SELECT m FROM Meeting m JOIN FETCH m.batches WHERE m.MeetingId = :meetingId")
	Optional<Meeting> FindByMeetingIdwithbatch(Long meetingId);

}
