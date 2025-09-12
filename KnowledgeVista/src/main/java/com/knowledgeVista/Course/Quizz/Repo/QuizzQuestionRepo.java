package com.knowledgeVista.Course.Quizz.Repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Course.Quizz.Quizzquestion;
import com.knowledgeVista.Course.Quizz.DTO.QuizzquestionDTO;

@Repository
public interface QuizzQuestionRepo extends JpaRepository<Quizzquestion, Long> {

	@Query("SELECT new com.knowledgeVista.Course.Quizz.Quizzquestion(a.questionId, a.questionText, a.option1, a.option2, a.option3, a.option4, a.answer) FROM Quizzquestion a WHERE a.quizz.quizzId = :quizzId ORDER BY a.questionId ASC")
	List<Quizzquestion> findByQuizzId(Long quizzId);

	@Query("SELECT new com.knowledgeVista.Course.Quizz.Quizzquestion(a.questionId, a.questionText, a.option1, a.option2, a.option3, a.option4, a.answer) FROM Quizzquestion a WHERE a.questionId = :questionId")
	Optional<Quizzquestion> findByIdrequired(Long questionId);

	@Query("SELECT q FROM Quizzquestion q WHERE q.questionId IN :questionIds AND q.quizz.quizzId = :quizzId")
	List<Quizzquestion> findByQuestionIdInAndQuizzQuizzId(List<Long> questionIds, Long quizzId);

	@Query("SELECT COUNT(q) FROM Quizzquestion q WHERE q.quizz.quizzId = :quizzId")
	Long countByQuizzId(@Param("quizzId") Long quizzId);

	@Query("SELECT new com.knowledgeVista.Course.Quizz.DTO.QuizzquestionDTO(q.questionId, q.questionText, q.option1, q.option2, q.option3, q.option4) "
			+ "FROM Quizzquestion q "
			+ "WHERE q.quizz.quizzId = :quizzId AND q.quizz.instituionName = :institutionName")
	List<QuizzquestionDTO> findQuestionsByQuizIdAndInstitution(@Param("quizzId") Long quizzId,
			@Param("institutionName") String institutionName);

}
