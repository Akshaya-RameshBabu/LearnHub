package com.knowledgeVista.AiIntegration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class OpenRouterKeys {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String openRouterKey;
	@Column(unique = true)
	private String email;
	@Enumerated(EnumType.STRING)
	private KeyType type;

	public enum KeyType {
		DEFAULT, PERSONAL
	}

	public void setType(KeyType type) {
		this.type = type;
	}

	public void setOpenRouterKey(String key) {
		this.openRouterKey = key;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	// Manual getters (if needed)
	public KeyType getType() {
		return type;
	}

	public String getOpenRouterKey() {
		return openRouterKey;
	}

	public String getEmail() {
		return email;
	}
}
