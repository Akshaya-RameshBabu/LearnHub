package com.knowledgeVista.Course;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.knowledgeVista.Course.Quizz.Quizz;
import com.knowledgeVista.Course.moduleTest.ModuleTest;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class videoLessons {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long lessonId;
	@ManyToOne
	@JoinColumn(name = "courseId")
	private CourseDetail courseDetail;
	@Column(name = "institution")
	private String institutionName;
	private String Lessontitle;

	@Column(length = 1000)
	private String LessonDescription;
	@Lob
	@Column(name = "thumbnail", length = 1000000)
	private byte[] thumbnail;

	@Transient
	@Column(nullable = true)
	private MultipartFile videoFile;

	private Long size;

	@Column(nullable = true)
	private String videofilename;
	@Column(nullable = true)
	private String fileUrl;

	@OneToMany(mappedBy = "VideoLessons", fetch = FetchType.LAZY)
	@JsonIgnore
	@JsonManagedReference
	private List<DocsDetails> documents;

	@Column(nullable = true)
	private String path;

	@OneToOne(mappedBy = "lessons", cascade = CascadeType.ALL, orphanRemoval = true)
	@JsonIgnore
	private Quizz quizz;
	@ManyToMany(mappedBy = "lessons")
	@JsonIgnore
	private List<ModuleTest> moduleTests;
}
