package com.knowledgeVista.Batch.Repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.BatchDto;
import com.knowledgeVista.Batch.BatchImageDTO;
import com.knowledgeVista.Batch.CourseDto;
import com.knowledgeVista.Batch.SearchDto;
import com.knowledgeVista.Batch.TrainerDto;
import com.knowledgeVista.Course.CourseDetailDto.courseIdNameImg;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.MuserDto;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {

	@Query("SELECT b FROM Batch b WHERE b.id = :id AND b.institutionName = :institutionName")
	Optional<Batch> findBatchByIdAndInstitutionName(@Param("id") Long id,
			@Param("institutionName") String institutionName);

	@Query("SELECT b FROM Batch b WHERE b.batchId = :id AND b.institutionName = :institutionName")
	Optional<Batch> findBatchByIdAndInstitutionName(@Param("id") String id,
			@Param("institutionName") String institutionName);

	@Query("SELECT new com.knowledgeVista.Course.CourseDetailDto$courseIdNameImg(c.courseId, c.courseName, c.courseImage) "
			+ "FROM Batch b " + "LEFT JOIN b.courses c " + "WHERE b.id = :id AND b.institutionName = :institutionName")
	List<courseIdNameImg> findCoursesOfBatchByBatchId(@Param("id") Long id,
			@Param("institutionName") String institutionName);

	@Query("SELECT b FROM Batch b JOIN b.courses c WHERE c.courseId = :courseId AND b.institutionName = :institutionName")
	List<Batch> findByCoursesCourseIdAndInstitutionName(@Param("courseId") Long courseId,
			@Param("institutionName") String institutionName);

	@Query("SELECT new com.knowledgeVista.Batch.BatchDto( "
			+ "b.id, b.batchId, b.batchTitle, b.startDate, b.endDate, b.institutionName, b.noOfSeats, b.amount,"
			+ "COALESCE(CAST(STRING_AGG(c.courseName, ',') AS string), ''), "
			+ "COALESCE(CAST(STRING_AGG(t.username, ',') AS string), ''), " + "b.BatchImage,b.paytype) "
			+ "FROM Batch b " + "LEFT JOIN b.courses c " + "LEFT JOIN b.trainers t "
			+ "WHERE b.id = :id AND b.institutionName = :institutionName "
			+ "GROUP BY b.id, b.batchId, b.batchTitle, b.startDate, b.endDate, b.institutionName, b.noOfSeats, b.amount,b.paytype")
	Optional<BatchDto> findBatchDtoByIdAndInstitutionName(@Param("id") Long id,
			@Param("institutionName") String institutionName);

	@Query("SELECT new com.knowledgeVista.Batch.CourseDto(c.courseId, c.courseName) " + "FROM Batch b "
			+ "JOIN b.courses c " + "WHERE b.id = :id AND b.institutionName = :institutionName")
	List<CourseDto> findCoursesByBatchIdAndInstitutionName(@Param("id") Long id,
			@Param("institutionName") String institutionName);

	@Query("SELECT new com.knowledgeVista.Batch.TrainerDto(t.userId, t.username) " + "FROM Batch b "
			+ "JOIN b.trainers t " + "WHERE b.id = :id AND b.institutionName = :institutionName")
	List<TrainerDto> findTrainersByBatchIdAndInstitutionName(@Param("id") Long id,
			@Param("institutionName") String institutionName);

	@Query("SELECT b FROM Batch b  WHERE b.institutionName = :institutionName")
	List<Batch> findAllBatchDtosByInstitution(@Param("institutionName") String institutionName);

	@Query("SELECT new com.knowledgeVista.Batch.SearchDto(u.id, u.batchTitle, 'BATCH') " + "FROM Batch u "
			+ "WHERE u.institutionName = :institutionName "
			+ "AND LOWER(u.batchTitle) LIKE LOWER(CONCAT('%', :Query, '%'))")
	List<SearchDto> findbatchAsSearchDto(@Param("Query") String Query,
			@Param("institutionName") String institutionName);

	@Query("SELECT b.id, b.batchId, b.batchTitle " + "FROM Batch b "
			+ "WHERE (:batchtitle IS NOT NULL AND :batchtitle <> '' AND LOWER(b.batchTitle) LIKE LOWER(CONCAT('%', :batchtitle, '%'))) "
			+ "AND (:institutionName IS NOT NULL AND :institutionName <> '' AND LOWER(b.institutionName) = LOWER(:institutionName))")
	List<Object[]> searchBatchByBatchNameAndInstitution(@Param("batchtitle") String batchtitle,
			@Param("institutionName") String institutionName);

	@Query("SELECT c.id FROM Batch b " + "JOIN b.courses c " + "WHERE b.id = :id")
	List<Long> findCourseIdsByBatchId(@Param("id") Long id);

	@Query("SELECT t.email FROM Batch b " + "JOIN b.trainers t " + "WHERE b.id = :id")
	List<String> findtrainersByBatchId(@Param("id") Long id);

	@Query("SELECT u.email FROM Batch b " + "JOIN b.users u " + "WHERE b.id = :id")
	List<String> findusersByBatchId(@Param("id") Long id);

	@Query("SELECT u FROM Batch b " + "JOIN b.users u " + "WHERE b.id = :id")
	List<Muser> findAllusersByBatchId(@Param("id") Long id);

	@Query("SELECT COUNT(u) FROM Batch b " + "JOIN b.users u " + "WHERE b.id = :id")
	Long countAllUsersByBatchId(@Param("id") Long id);

	@Query("SELECT new com.knowledgeVista.User.MuserDto(u.userId, u.username, u.email, u.phone, u.isActive, u.dob, u.skills,u.institutionName) "
			+ "FROM Batch b " + "JOIN b.users u " + "WHERE b.id = :id")
	Page<MuserDto> GetMuserDetailsByBatchID(@Param("id") Long id, Pageable pageable);

	@Query("SELECT new com.knowledgeVista.User.MuserDto(" + "m.userId, " + "m.username, " + "m.email, " + "m.phone, "
			+ "m.isActive, " + "m.dob, " + "m.skills," + "m.institutionName) " + "FROM Muser m "
			+ "JOIN m.enrolledbatch b " + "WHERE b.id = :batchId AND "
			+ "( (:username IS NULL OR LOWER(m.username) LIKE LOWER(CONCAT(:username, '%'))) AND "
			+ "(:email IS NULL OR LOWER(m.email) LIKE LOWER(CONCAT(:email, '%'))) AND "
			+ "(:phone IS NULL OR LOWER(m.phone) LIKE LOWER(CONCAT(:phone, '%'))) AND "
			+ "(:dob IS NULL OR m.dob = :dob) AND " + "(m.institutionName = :institutionName) AND "
			+ "(m.role.roleName = :roleName) AND "
			+ "(:skills IS NULL OR LOWER(m.skills) LIKE LOWER(CONCAT(:skills, '%'))) )")
	Page<MuserDto> searchUsersByBatch(@Param("batchId") Long batchId, @Param("username") String username,
			@Param("email") String email, @Param("phone") String phone, @Param("dob") LocalDate dob,
			@Param("institutionName") String institutionName, @Param("roleName") String roleName,
			@Param("skills") String skills, Pageable pageable);

	@Query(value = "SELECT b.id AS id, " + "b.batch_id AS batchId, " + "b.batch_title AS batchTitle, "
			+ "b.start_date AS startDate, " + "b.end_date AS endDate, " + "b.institution_name AS institutionName, "
			+ "b.no_of_seats AS noOfSeats, " + "b.amount AS amount, "
			+ "COALESCE(STRING_AGG(DISTINCT c.course_name, ','), '') AS courseNames, "
			+ "COALESCE(STRING_AGG(DISTINCT t.username, ','), '') AS trainerNames, " + "b.batch_image AS batchImage, "
			+ "b.paytype AS payType, "
			+ "TO_CHAR(b.start_date, 'Mon') || ' to ' || TO_CHAR(b.end_date, 'Mon') AS duration " + "FROM batch b "
			+ "LEFT JOIN batch_courses bc ON b.id = bc.batch_id "
			+ "LEFT JOIN course_detail c ON c.course_id = bc.course_id "
			+ "LEFT JOIN batch_trainers bt ON b.id = bt.batch_id " + "LEFT JOIN muser t ON t.user_id = bt.user_id "
			+ "WHERE bt.user_id = :trainerId " + // Fetch batches assigned to the trainer
			"GROUP BY b.id, b.batch_id, b.batch_title, b.start_date, b.end_date, "
			+ "b.institution_name, b.no_of_seats, b.amount, b.paytype " + "ORDER BY b.start_date DESC "
			+ "LIMIT :pageSize OFFSET :offset", nativeQuery = true)
	List<Map<String, Object>> findAssignedBatchesForTrainerIdWithPagination(@Param("trainerId") Long trainerId,
			@Param("pageSize") int pageSize, @Param("offset") int offset);

	@Query(value = "SELECT COUNT(DISTINCT b.id) FROM batch b " + "LEFT JOIN batch_trainers bt ON b.id = bt.batch_id "
			+ "WHERE bt.user_id = :trainerId", nativeQuery = true)
	long countAssignedBatchesForTrainerId(@Param("trainerId") Long trainerId);

	@Query(value = "SELECT b.id AS id, "
			+ "b.batch_id AS batchId, b.batch_title AS batchTitle, b.start_date AS startDate, "
			+ "b.end_date AS endDate, b.institution_name AS institutionName, b.no_of_seats AS noOfSeats, "
			+ "b.amount AS amount, " + "COALESCE(STRING_AGG(DISTINCT c.course_name, ','), '') AS courseNames, "
			+ "COALESCE(STRING_AGG(DISTINCT t.username, ','), '') AS trainerNames, "
			+ "b.batch_image AS batchImage, b.paytype AS payType, "
			+ "TO_CHAR(b.start_date, 'Mon') || ' to ' || TO_CHAR(b.end_date, 'Mon') AS duration, "
			+ "(SELECT COUNT(bu.user_id) FROM batch_users bu WHERE bu.batch_id = b.id) AS enrolledUsers "
			+ "FROM batch b " + "LEFT JOIN batch_courses bc ON b.id = bc.batch_id "
			+ "LEFT JOIN course_detail c ON c.course_id = bc.course_id "
			+ "LEFT JOIN batch_trainers bt ON b.id = bt.batch_id " + "LEFT JOIN muser t ON t.user_id = bt.user_id "
			+ "JOIN muser u ON u.user_id = :trainerId " + "WHERE b.institution_name = u.institution_name "
			+ "AND NOT EXISTS (" + "    SELECT 1 FROM batch_trainers bt2 "
			+ "    WHERE bt2.batch_id = b.id AND bt2.user_id = :trainerId" + ") "
			+ "GROUP BY b.id, b.batch_id, b.batch_title, b.start_date, b.end_date, "
			+ "b.institution_name, b.no_of_seats, b.amount, b.paytype " + "ORDER BY b.start_date DESC "
			+ "LIMIT :pageSize OFFSET :offset", nativeQuery = true)
	List<Map<String, Object>> findBatchesNotAssignedForTrainerIdWithPagination(@Param("trainerId") Long trainerId,
			@Param("pageSize") int pageSize, @Param("offset") int offset);

	@Query(value = "SELECT COUNT(DISTINCT b.id) FROM batch b " + "LEFT JOIN batch_trainers bt ON b.id = bt.batch_id "
			+ "WHERE (bt.user_id IS NULL OR bt.user_id != :trainerId)", nativeQuery = true)
	long countBatchesNotAssignedForTrainerId(@Param("trainerId") Long trainerId);

	// =================below For users====================
	@Query(value = "SELECT b.id AS id, " + "b.batch_id AS batchId, " + "b.batch_title AS batchTitle, "
			+ "b.start_date AS startDate, " + "b.end_date AS endDate, " + "b.institution_name AS institutionName, "
			+ "b.no_of_seats AS noOfSeats, " + "b.amount AS amount, "
			+ "COALESCE(STRING_AGG(DISTINCT c.course_name, ','), '') AS courseNames, "
			+ "COALESCE(STRING_AGG(DISTINCT t.username, ','), '') AS trainerNames, " + "b.batch_image AS batchImage, "
			+ "b.paytype AS payType, "
			+ "TO_CHAR(b.start_date, 'Mon') || ' to ' || TO_CHAR(b.end_date, 'Mon') AS duration " + // Format duration
			"FROM batch b " + "LEFT JOIN batch_courses bc ON b.id = bc.batch_id "
			+ "LEFT JOIN course_detail c ON c.course_id = bc.course_id "
			+ "LEFT JOIN batch_trainers bt ON b.id = bt.batch_id " + "LEFT JOIN muser t ON t.user_id = bt.user_id "
			+ "LEFT JOIN batch_users bu ON b.id = bu.batch_id " + "WHERE bu.user_id = :userId "
			+ "GROUP BY b.id, b.batch_id, b.batch_title, b.start_date, b.end_date, "
			+ "b.institution_name, b.no_of_seats, b.amount, b.paytype " + "ORDER BY b.start_date DESC "
			+ "LIMIT :pageSize OFFSET :offset", nativeQuery = true)
	List<Map<String, Object>> findBatchesByUserIdWithPagination(@Param("userId") Long userId,
			@Param("pageSize") int pageSize, @Param("offset") int offset);

	@Query(value = "SELECT COUNT(DISTINCT b.id) FROM batch b " + "LEFT JOIN batch_users bu ON b.id = bu.batch_id "
			+ "WHERE bu.user_id = :userId", nativeQuery = true)
	long countBatchesByUserId(@Param("userId") Long userId);

	@Query(value = "SELECT b.id AS id, "
			+ "b.batch_id AS batchId, b.batch_title AS batchTitle, b.start_date AS startDate, "
			+ "b.end_date AS endDate, b.institution_name AS institutionName, b.no_of_seats AS noOfSeats, "
			+ "b.amount AS amount, " + "COALESCE(STRING_AGG(DISTINCT c.course_name, ','), '') AS courseNames, "
			+ "COALESCE(STRING_AGG(DISTINCT t.username, ','), '') AS trainerNames, "
			+ "b.batch_image AS batchImage, b.paytype AS payType, "
			+ "TO_CHAR(b.start_date, 'Mon') || ' to ' || TO_CHAR(b.end_date, 'Mon') AS duration, "
			+ "(SELECT COUNT(bu.user_id) FROM batch_users bu WHERE bu.batch_id = b.id) AS enrolledUsers "
			+ "FROM batch b " + "LEFT JOIN batch_courses bc ON b.id = bc.batch_id "
			+ "LEFT JOIN course_detail c ON c.course_id = bc.course_id "
			+ "LEFT JOIN batch_trainers bt ON b.id = bt.batch_id " + "LEFT JOIN muser t ON t.user_id = bt.user_id "
			+ "JOIN muser u ON u.user_id = :userId " + "WHERE b.institution_name = u.institution_name "
			+ "AND NOT EXISTS ( " + "    SELECT 1 FROM batch_users bu "
			+ "    WHERE bu.batch_id = b.id AND bu.user_id = :userId " + ") "
			+ "GROUP BY b.id, b.batch_id, b.batch_title, b.start_date, b.end_date, "
			+ "b.institution_name, b.no_of_seats, b.amount, b.paytype "
			+ "HAVING b.no_of_seats > (SELECT COUNT(bu.user_id) FROM batch_users bu WHERE bu.batch_id = b.id) "
			+ "ORDER BY b.start_date DESC " + "LIMIT :pageSize OFFSET :offset", nativeQuery = true)
	List<Map<String, Object>> findBatchesNotEnrolledByUserIdWithPagination(@Param("userId") Long userId,
			@Param("pageSize") int pageSize, @Param("offset") int offset);

	@Query(value = "SELECT COUNT(DISTINCT b.id) FROM batch b " + "LEFT JOIN batch_users bu ON b.id = bu.batch_id "
			+ "WHERE (bu.user_id IS NULL OR bu.user_id != :userId) "
			+ "AND b.no_of_seats > (SELECT COUNT(bu2.user_id) FROM batch_users bu2 WHERE bu2.batch_id = b.id)", nativeQuery = true)
	long countBatchesNotEnrolledByUserId(@Param("userId") Long userId);

	@Query("SELECT new com.knowledgeVista.Batch.BatchImageDTO(b.id,b.BatchImage) FROM Batch b WHERE b.id IN :ids")
	List<BatchImageDTO> findBatchImagesByIds(@Param("ids") List<Long> ids);

}
