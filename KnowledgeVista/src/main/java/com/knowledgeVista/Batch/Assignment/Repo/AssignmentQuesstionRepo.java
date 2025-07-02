package com.knowledgeVista.Batch.Assignment.Repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Batch.Assignment.Assignment;
import com.knowledgeVista.Batch.Assignment.AssignmentQuestion;

@Repository
public interface AssignmentQuesstionRepo extends JpaRepository<AssignmentQuestion, Long> {

	@Query("SELECT q FROM AssignmentQuestion q WHERE q.assignment = :assignment")
	List<AssignmentQuestion> findByAssignment(@Param("assignment") Assignment assignment);

	@Query("SELECT COUNT(q) FROM AssignmentQuestion q WHERE q.assignment.id = :assignmentId")
	Integer countByAssignmentId(@Param("assignmentId") Long assignmentId);

}
