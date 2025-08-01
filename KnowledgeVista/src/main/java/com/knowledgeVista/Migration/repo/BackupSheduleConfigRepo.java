package com.knowledgeVista.Migration.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Migration.model.BackupScheduleConfig;

@Repository
public interface BackupSheduleConfigRepo extends JpaRepository<BackupScheduleConfig, Long> {
	@Query("SELECT b FROM BackupScheduleConfig b WHERE b.institutionName=:institution ")
	Optional<BackupScheduleConfig> findByInstitutionName(@Param("institution") String institution);

}
