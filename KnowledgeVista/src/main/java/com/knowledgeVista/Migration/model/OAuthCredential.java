package com.knowledgeVista.Migration.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OAuthCredential {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank(message = "Institution name is required")
	@Size(max = 100, message = "Institution name cannot exceed 100 characters")
	@Column(name = "institution_name", unique = true, nullable = false, length = 100)
	private String institutionName;

	@NotBlank(message = "Client ID is required")
	@Column(name = "client_id", nullable = false, columnDefinition = "TEXT")
	private String clientId;

	@NotBlank(message = "Client Secret is required")
	@Column(name = "client_secret", nullable = false, columnDefinition = "TEXT")
	private String clientSecret;

	@Column(name = "refresh_token", columnDefinition = "TEXT")
	private String refreshToken;

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	@Column(name = "updated_at")
	private LocalDateTime updatedAt = LocalDateTime.now();

	@PreUpdate
	public void setUpdatedAt() {
		this.updatedAt = LocalDateTime.now();
	}
}
