package com.knowledgeVista.Migration.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class BackupScheduleConfig {

	public enum ScheduleType {
		DAILY, WEEKLY, MONTHLY
	}

	public enum DayOfWeek {
		SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank(message = "Institution name is required")
	@Size(max = 100, message = "Institution name cannot exceed 100 characters")
	@Column(name = "institution_name", unique = true, nullable = false, length = 100)
	private String institutionName;

	@NotNull(message = "Schedule type is required")
	@Enumerated(EnumType.STRING)
	@Column(name = "schedule_type", nullable = false)
	private ScheduleType scheduleType;

	@Enumerated(EnumType.STRING)
	@Column(name = "day_of_week")
	private DayOfWeek dayOfWeek;

	@Min(value = 1, message = "Day of month must be between 1 and 31")
	@Max(value = 31, message = "Day of month must be between 1 and 31")
	@Column(name = "day_of_month")
	private Integer dayOfMonth;

	@Min(value = 2, message = "Minimum backups to keep must be 2")
	@Max(value = 5, message = "Maximum backups to keep cannot exceed 5")
	@Column(name = "max_backups_to_keep", nullable = false)
	private Integer maxBackupsToKeep = 2; // Default to 2

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt = LocalDateTime.now();

	@Column(name = "updated_at")
	private LocalDateTime updatedAt = LocalDateTime.now();

	@PreUpdate
	public void setUpdatedAt() {
		this.updatedAt = LocalDateTime.now();
	}
}
