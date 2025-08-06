package com.knowledgeVista.Course;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class DocsDetails {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long Id;
	@Column(nullable = true, unique = true)
	private String documentPath;

	@Column(nullable = true)
	private String documentName;

	// Optionally, if you want to store the actual document in the database as a
	// binary
	@Lob
	@Column(name = "documentContent", nullable = true)
	private byte[] documentContent;

	@ManyToOne
	@JoinColumn(name = "lessonId")
	@JsonIgnore
	@JsonBackReference
	private videoLessons VideoLessons;

	@ElementCollection
	@JsonIgnore
	@Column(name = "miniatureDetails", nullable = true)
	private List<MiniatureDetail> miniatureDetails = new ArrayList<>();

	public DocsDetails(Long id, String documentPath, String documentName) {
		super();
		Id = id;
		this.documentPath = documentPath;
		this.documentName = documentName;
	}
}
