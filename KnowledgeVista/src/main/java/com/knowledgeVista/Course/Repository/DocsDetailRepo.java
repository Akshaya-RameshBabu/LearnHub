package com.knowledgeVista.Course.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.DocsDetails;
import com.knowledgeVista.Course.MiniatureDetail;

@Repository
public interface DocsDetailRepo extends JpaRepository<DocsDetails, Long> {
	@Query("SELECT new com.knowledgeVista.Course.DocsDetails(d.Id, d.documentPath, d.documentName) FROM DocsDetails d WHERE d.VideoLessons.lessonId = :lessonId")
	List<DocsDetails> findByLessonId(Long lessonId);

	@Query("SELECT documentPath FROM DocsDetails vd WHERE vd.id = :id ")
	String findDocumetByid(Long id);

	@Query("SELECT d.VideoLessons.courseDetail  FROM DocsDetails d WHERE d.documentPath=:documentPath")
	Optional<CourseDetail> FindCourseByFileName(String documentPath);

	@Query("SELECT d.miniatureDetails FROM DocsDetails d WHERE d.Id = :Id")
	List<MiniatureDetail> findMiniatureById(@Param("Id") Long Id);

	@Query("SELECT d.VideoLessons.courseDetail FROM DocsDetails d WHERE d.VideoLessons.lessonId = :lessonId")
	Optional<CourseDetail> FindCourseBylessonId(@Param("lessonId") Long lessonId);

}
