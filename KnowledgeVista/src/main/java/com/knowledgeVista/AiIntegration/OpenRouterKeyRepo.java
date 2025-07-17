package com.knowledgeVista.AiIntegration;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface OpenRouterKeyRepo extends JpaRepository<OpenRouterKeys, Long> {
	@Query("SELECT k from OpenRouterKeys k WHERE k.email=:email")
	Optional<OpenRouterKeys> FindByEmail(String email);

	@Query("SELECT k.openRouterKey from OpenRouterKeys k WHERE k.email=:email")
	String FindKeyByEmail(String email);

	@Query("SELECT k.openRouterKey from OpenRouterKeys k WHERE k.type='DEFAULT'")
	String getDefaultKeys();

}
