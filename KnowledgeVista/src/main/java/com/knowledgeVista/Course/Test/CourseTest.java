package com.knowledgeVista.Course.Test;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.knowledgeVista.Course.CourseDetail;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class CourseTest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long testId;

	@ManyToOne
	@JoinColumn(name = "courseId")
	@JsonIgnoreProperties("courseTests")
	private CourseDetail courseDetail;

	private String testName;

	private Long noOfQuestions;
	private Long noofattempt;
	private Double passPercentage;

	@OneToMany(mappedBy = "test", cascade = CascadeType.REMOVE)
	@OrderBy("questionId ASC")
	private List<Question> questions;

}
