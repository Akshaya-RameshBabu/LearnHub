package com.knowledgeVista.Course.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.LessonQuizDTO;
import com.knowledgeVista.Course.VideoLessonDTO;
import com.knowledgeVista.Course.videoLessons;

public interface videoLessonRepo extends JpaRepository<videoLessons, Long> {
	
	@Query("SELECT new com.knowledgeVista.Course.VideoLessonDTO(v.lessonId, v.Lessontitle) " +
		       "FROM videoLessons v WHERE LOWER(v.Lessontitle) LIKE LOWER(CONCAT('%', :title, '%')) " +
		       "AND v.courseDetail.courseId = :courseId AND v.institutionName = :institution")
		List<VideoLessonDTO> searchByTitle(@Param("title") String title, 
		                                   @Param("institution") String institution, 
		                                   @Param("courseId") Long courseId);

	 @Query("SELECT new com.knowledgeVista.Course.VideoLessonDTO(v.lessonId, v.Lessontitle) " +
	"FROM videoLessons v WHERE v.courseDetail.courseId = :courseId AND v.institutionName = :institution")
		List<VideoLessonDTO> FindlessonIdBycourseID(
		                                   @Param("institution") String institution, 
		                                   @Param("courseId") Long courseId);
 
	  @Query("SELECT vd FROM videoLessons vd WHERE vd.lessonId IN :lessonIds AND vd.institutionName = :institutionName")
	  List<videoLessons> findByLessonIdsAndInstitutionName(
	      @Param("lessonIds") List<Long> lessonIds, 
	      @Param("institutionName") String institutionName
	  );

	 @Query("SELECT cd FROM videoLessons cd WHERE cd.id = :videoLessons AND cd.institutionName = :institutionName")
	 Optional<videoLessons> findBylessonIdAndInstitutionName(@Param("videoLessons") Long videoLesson, @Param("institutionName") String institutionName);
   
	 @Query("SELECT vd FROM videoLessons vd WHERE vd.institutionName = :institutionName ")
	 List<videoLessons>findAllByInstitutionName(String institutionName);
	 @Query("SELECT cd.courseDetail FROM videoLessons cd WHERE cd.lessonId = :lessonId ")
	 Optional<CourseDetail> FindbyCourseByLessonId(Long lessonId);
	 
	 @Query("SELECT SUM(v.size) FROM videoLessons v WHERE v.institutionName = :institutionName")
	 Long findTotalSizeByInstitution(@Param("institutionName") String institutionName);
	 		
	 @Query("""
			    SELECT new com.knowledgeVista.Course.LessonQuizDTO(
			        v.lessonId, v.Lessontitle, q.quizzId, q.quizzName) 
			    FROM videoLessons v
			    LEFT JOIN v.quizz q
			    WHERE v.courseDetail.courseId = :courseId
			""")
			List<LessonQuizDTO> findLessonsWithQuizByCourseId(@Param("courseId") Long courseId);

}
