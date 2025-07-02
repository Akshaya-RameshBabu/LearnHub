package com.knowledgeVista.Batch;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GradeDto {
	private String batchName;
	private double weightedTest;
	private double weightedQuiz;
	private double weightedAttendance;
	private double totalScore;
	private double weightedAssignment;
	private String result;
	private byte[] batchImage;

	public GradeDto(String batchName, double weightedTest, double weightedQuiz, double weightedAttendance,
			double totalScore, double weightedAssignment, String result) {
		super();
		this.batchName = batchName;
		this.weightedTest = weightedTest;
		this.weightedQuiz = weightedQuiz;
		this.weightedAttendance = weightedAttendance;
		this.totalScore = totalScore;
		this.weightedAssignment = weightedAssignment;
		this.result = result;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class GradeDtoWithUserDetails {
		private GradeDto gradeDto;
		private byte[] profile; // Corrected data type
		private String userName;
		private String email;
	}
}
