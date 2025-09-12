package com.knowledgeVista.Course.moduleTest.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Course.moduleTest.MQuestion;

@Repository
public interface MQuestionRepo extends JpaRepository<MQuestion, Long> {

	@Query("SELECT new com.knowledgeVista.Course.moduleTest.MQuestion("
			+ "Q.questionId, Q.questionText, Q.option1, Q.option2, Q.option3, Q.option4, Q.answer) "
			+ "FROM MQuestion Q " + "WHERE Q.mtest.mtestId = :mtestId " + "ORDER BY Q.questionId ASC")
	List<MQuestion> findByModuleTestId(@Param("mtestId") Long mtestId);

	@Query("SELECT new com.knowledgeVista.Course.moduleTest.MQuestion(Q.questionId,Q.questionText,Q.option1,Q.option2,Q.option3,Q.option4)"
			+ " FROM MQuestion Q WHERE Q.mtest.mtestId=:mtestId")
	List<MQuestion> getQuestionsBymtestId(@Param("mtestId") Long mtestId);

	@Query("SELECT COUNT(q) FROM MQuestion q WHERE q.mtest.mtestId = :mtestId")
	Long countBymtestId(@Param("mtestId") Long mtestId);
}
