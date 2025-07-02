package com.knowledgeVista.Course.moduleTest.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Course.moduleTest.MTSheduleListDto;
import com.knowledgeVista.Course.moduleTest.ModuleTest;

@Repository
public interface moduleTestRepo extends JpaRepository<ModuleTest, Long> {

	@Query("SELECT new com.knowledgeVista.Course.moduleTest.ModuleTest(mt.mtestId, mt.mtestName, mt.mnoOfQuestions, mt.mnoOfAttempt, mt.mpassPercentage) FROM ModuleTest mt WHERE mt.mtestId = :id")
	Optional<ModuleTest> findModuleTestWithoutRelations(@Param("id") Long id);

	@Query("SELECT new com.knowledgeVista.Course.moduleTest.ModuleTest(mt.mtestId, mt.mtestName, mt.mnoOfQuestions, mt.mnoOfAttempt, mt.mpassPercentage) FROM ModuleTest mt WHERE mt.courseDetail.courseId = :id")
	List<ModuleTest> findModuleTestListWithoutRelations(@Param("id") Long id);

	@Query("SELECT new com.knowledgeVista.Course.moduleTest.MTSheduleListDto(m.mtestId, m.mtestName, s.testDate) "
			+ "FROM ModuleTest m " + "JOIN m.courseDetail c " + "JOIN c.batches b " + "LEFT JOIN m.schedules s "
			+ "ON s.batch.id = :batchId " + // Ensure schedule belongs to the batch
			"WHERE c.courseId = :courseId " + "AND b.id = :batchId")
	List<MTSheduleListDto> getQuizzShedulesByCourseIdAndBatchId(@Param("courseId") Long courseId,
			@Param("batchId") Long batchId);
}
