package com.knowledgeVista.License;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
public class Madmin_Licence {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long madminId;
	private Long AdminId;
	@Column(unique = true)
	private String institution;
//	    private String admincode;
	private String licenceType;
	private LocalDate updatedDate;

}
