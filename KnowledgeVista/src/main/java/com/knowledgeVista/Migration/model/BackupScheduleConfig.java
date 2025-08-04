package com.knowledgeVista.Migration.model;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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

	@Min(1)
	@Max(31)
	@Column(name = "day_of_month")
	private Integer dayOfMonth;

	@Min(2)
	@Max(5)
	@Column(name = "max_backups_to_keep", nullable = false)
	private Integer maxBackupsToKeep = 2;

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@NotNull(message = "Backup time is required")
	@Column(name = "backup_time", nullable = false)
	@JsonFormat(pattern = "HH:mm")
	private LocalTime backupTime;

	@PrePersist
	public void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
	}

	@PreUpdate
	public void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}
}
