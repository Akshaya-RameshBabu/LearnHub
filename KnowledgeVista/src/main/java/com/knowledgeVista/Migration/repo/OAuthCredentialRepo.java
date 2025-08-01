package com.knowledgeVista.Migration.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Migration.model.OAuthCredential;

@Repository
public interface OAuthCredentialRepo extends JpaRepository<OAuthCredential, Long> {

	@Query("SELECT c FROM OAuthCredential c WHERE c.institutionName=:institutionName")
	Optional<OAuthCredential> findByInstitutionName(@Param("institutionName") String institutionName);

	@Query("SELECT c FROM OAuthCredential c WHERE c.institutionName='Meganartech'")
	Optional<OAuthCredential> getDefaultKeys();
}
