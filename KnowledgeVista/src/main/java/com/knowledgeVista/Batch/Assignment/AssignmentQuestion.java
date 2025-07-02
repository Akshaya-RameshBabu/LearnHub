package com.knowledgeVista.Batch.Assignment;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentQuestion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "assignment_id", nullable = false)
	private Assignment assignment;

	private String questionText; // Question statement

	private String option1;
	private String option2;
	private String option3;
	private String option4;

	private String answer; // Only for QUIZ

	@Override
	public String toString() {
		return "AssignmentQuestion [id=" + id + ", assignment=" + assignment + ", questionText=" + questionText
				+ ", option1=" + option1 + ", option2=" + option2 + ", option3=" + option3 + ", option4=" + option4
				+ ", answer=" + answer + "]";
	}

}
