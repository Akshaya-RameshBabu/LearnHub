package com.knowledgeVista.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.util.Base64;
import javax.crypto.SecretKey;

@Configuration
public class SecretConfig {
    
    @Bean
    public String jwtSecret() {
        // Generate a secure random JWT secret if not provided
        String envSecret = System.getenv("JWT_SECRET");
        if (envSecret == null || envSecret.trim().isEmpty()) {
            // Generate a secure key specifically for HS256
            SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            return Base64.getEncoder().encodeToString(key.getEncoded());
        }
        // If environment variable is provided, ensure it's base64 encoded and has sufficient length
        try {
            byte[] decodedKey = Base64.getDecoder().decode(envSecret);
            if (decodedKey.length * 8 < 256) { // Check if key is at least 256 bits
                // If key is too short, generate a new one
                SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
                return Base64.getEncoder().encodeToString(key.getEncoded());
            }
            return envSecret;
        } catch (IllegalArgumentException e) {
            // If not base64 encoded or invalid, generate a new secure key
            SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            return Base64.getEncoder().encodeToString(key.getEncoded());
        }
    }
    public String maskSensitiveData(String data, String type) {
        if (data == null || data.isEmpty()) {
            return "••••••••";
        }
        
        switch (type) {
            case "email":
                String[] parts = data.split("@");
                return parts[0].substring(0, Math.min(3, parts[0].length())) + "...@" + parts[1];
            case "password":
                return "••••••••";
            case "host":
                String[] hostParts = data.split("\\.");
                return hostParts[0] + "...";
            case "port":
                return "••••";
            default:
                return data.substring(0, Math.min(3, data.length())) + "...";
        }
    }
    
    // Method to validate sensitive data
    public boolean validateSensitiveData(String data, String type) {
        if (data == null || data.isEmpty()) {
            return false;
        }
        
        switch (type) {
            case "email":
                return data.matches("^[A-Za-z0-9+_.-]+@(.+)$");
            case "password":
                return data.length() >= 8;
            case "host":
                return data.matches("^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
            case "port":
                try {
                    int port = Integer.parseInt(data);
                    return port > 0 && port < 65536;
                } catch (NumberFormatException e) {
                    return false;
                }
            default:
                return true;
        }
    }

  
} 