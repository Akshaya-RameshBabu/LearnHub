package com.knowledgeVista.Settings.Repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.knowledgeVista.Settings.OpenRouterKeys;

@Repository
public interface OpenRouterKeyRepo extends JpaRepository<OpenRouterKeys,Long> {
    @Query("SELECT k.openRouterKey from OpenRouterKeys k WHERE k.InstitutionName=:institutionName") 
    String findByInstitution(String institutionName);
    @Query("SELECT k.openRouterKey from OpenRouterKeys k WHERE k.InstitutionName=:institutionName") 
    String findkeyByInstitution(String institutionName);
}