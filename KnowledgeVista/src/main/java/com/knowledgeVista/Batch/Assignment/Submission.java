package com.knowledgeVista.Batch.Assignment;

import java.time.LocalDateTime;
import java.util.Map;

import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.User.Muser;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyColumn;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "assignment_id", nullable = false)
	private Assignment assignment;
	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false) // <-- match the PK name in Muser
	private Muser user;
	@ManyToOne

	@JoinColumn(name = "batch_id", nullable = false) // <-- Add this line
	private Batch batch;
	@ElementCollection
	@CollectionTable(name = "submission_answers", joinColumns = @JoinColumn(name = "submission_id"))
	@MapKeyColumn(name = "question_id") // Key = Question ID
	@Column(name = "answer_text", length = 5000)
	private Map<Long, String> answers; // Map<QuestionID, AnswerText>
	private String fileName;
	private String uploadedFileUrl;
	private LocalDateTime submittedAt;
	@Enumerated(EnumType.STRING)
	private SubmissionStatus submissionStatus = SubmissionStatus.NOT_SUBMITTED;
	private boolean isGraded;
	private Integer totalMarksObtained;
	private String feedback;

	public enum SubmissionStatus {
		NOT_SUBMITTED, SUBMITTED, LATE_SUBMISSION, VALIDATED
	}

}
