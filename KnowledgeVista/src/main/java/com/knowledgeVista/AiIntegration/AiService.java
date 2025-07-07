package com.knowledgeVista.AiIntegration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import com.knowledgeVista.Settings.Repo.OpenRouterKeyRepo;
import com.knowledgeVista.config.EncryptionUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AiService {
    
	@Value("${openrouter.api.key}")
	private String openRouterApiKey;
	private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    
	@Autowired
	private OpenRouterKeyRepo openrouterKeysRepo;

    private String getOpenRouterKey(String email) {
		try {
			String key = openrouterKeysRepo.FindKeyByEmail(email);
	
			if (key != null) {
				key = EncryptionUtil.decrypt(key);
				return key;
			}
	
			String defaultKey = openrouterKeysRepo.getDefaultKeys();
			if (defaultKey != null) {
				defaultKey = EncryptionUtil.decrypt(defaultKey);
				return defaultKey;
			}
			return openRouterApiKey;
	
		} catch (Exception e) { 
			e.printStackTrace(); // optional, for debugging
			return openRouterApiKey; // fallback on any error
		}
	}
	
    public void callQwenAIAndStreamResponse(String prompt, String email, ResponseBodyEmitter emitter) {
        WebClient webClient = WebClient.builder()
            .baseUrl("https://openrouter.ai")
            .defaultHeader("Authorization", "Bearer " + getOpenRouterKey(email))
            .build();
    
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "qwen/qwen3-30b-a3b:free");
        List<Map<String, String>> messages = List.of(
            Map.of("role", "user", "content", prompt)
        );
        requestBody.put("messages", messages);
    
        ObjectMapper objectMapper = new ObjectMapper();
        StringBuilder fullContent = new StringBuilder();

        webClient.post()
            .uri("/api/v1/chat/completions")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_NDJSON, MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToFlux(String.class)
            .subscribe(
                chunk -> {
                    try {
                        // Each chunk is a JSON line (NDJSON)
                        JsonNode node = objectMapper.readTree(chunk);
                        // Try to extract incremental content (delta streaming)
                        String content = null;
                        if (node.has("choices")) {
                            JsonNode choices = node.get("choices");
                            if (choices.isArray() && choices.size() > 0) {
                                JsonNode choice = choices.get(0);
                                // OpenRouter/Chat APIs may use 'delta' or 'message' for streaming
                                if (choice.has("delta") && choice.get("delta").has("content")) {
                                    content = choice.get("delta").get("content").asText();
                                } else if (choice.has("message") && choice.get("message").has("content")) {
                                    content = choice.get("message").get("content").asText();
                                } else if (choice.has("content")) {
                                    content = choice.get("content").asText();
                                }
                            }
                        } else if (node.has("content")) {
                            content = node.get("content").asText();
                        }
                        if (content != null && !content.isEmpty()) {
                            fullContent.append(content);
                            emitter.send(content);
                        }
                    } catch (Exception e) {
                        logger.error("Error parsing AI stream chunk", e);
                        emitter.completeWithError(e);
                    }
                },
                error -> {
                    emitter.completeWithError(error);
                },
                emitter::complete
            );
    }
} 
