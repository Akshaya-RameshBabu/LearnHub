package com.knowledgeVista.Settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class OpenRouterKeys {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String openRouterKey;
    @Column(unique=true)
    private String email;
    @Enumerated(EnumType.STRING)
    private KeyType type;

    public enum KeyType {
        DEFAULT, PERSONAL
    } 
}

