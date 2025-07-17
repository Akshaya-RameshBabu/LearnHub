package com.knowledgeVista.AiIntegration;

import java.io.File;
import java.lang.reflect.Method;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import com.knowledgeVista.PluginLoader;
import com.knowledgeVista.AiIntegration.OpenRouterKeys.KeyType;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.knowledgeVista.config.EncryptionUtil;

@Service
public class GwenAiService {

	@Value("${ai.plugin.jar.path:plugins/qwen-integration.jar}")
	private String pluginPath;
	@Value("${openrouter.api.key}")
	private String openRouterApiKey;
	@Autowired
	private JwtUtil jwtUtil;
	private final EncryptionUtil encryptionUtil;
	@Autowired
	private OpenRouterKeyRepo openrouterKeysRepo;

	GwenAiService(EncryptionUtil encryptionUtil) {
		this.encryptionUtil = encryptionUtil;
	}

	public ResponseEntity<?> getOpenRouterKeys(String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			String encryptedKey = openrouterKeysRepo.FindKeyByEmail(email);
			if (encryptedKey != null) {
				String decryptedKey;
				try {
					decryptedKey = EncryptionUtil.decrypt(encryptedKey);
				} catch (Exception e) {
					e.printStackTrace();
					return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Decryption failed");
				}
				java.util.Map<String, String> result = new java.util.HashMap<>();
				result.put("openRouterKey", decryptedKey);
				return ResponseEntity.ok(result);
			} else {
				return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
			}

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		}
	}

	public ResponseEntity<?> saveOpenRouterKeys(String token, String openRouterKey) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
			String role = jwtUtil.getRoleFromToken(token);
			Optional<OpenRouterKeys> keys = openrouterKeysRepo.FindByEmail(email);
			String encryptedKey;
			OpenRouterKeys saving = new OpenRouterKeys();
			if ("SYSADMIN".equals(role)) {
				saving.setType(KeyType.DEFAULT);
			} else {
				saving.setType(KeyType.PERSONAL);
			}

			try {
				encryptedKey = EncryptionUtil.encrypt(openRouterKey);
			} catch (Exception e) {
				e.printStackTrace();
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Encryption failed");
			}
			if (keys.isPresent()) {
				saving = keys.get();
				saving.setOpenRouterKey(encryptedKey);
				openrouterKeysRepo.save(saving);
				return ResponseEntity.ok("Updated");
			} else {
				saving.setOpenRouterKey(encryptedKey);
				saving.setEmail(email);
				openrouterKeysRepo.save(saving);
				return ResponseEntity.ok("Saved");
			}

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred");
		}
	}

	private String getOpenRouterKey(String token) {
		try {
			String email = jwtUtil.getEmailFromToken(token);
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

	public void callaiPlugin(String email, ResponseBodyEmitter emitter, String prompt) {
		try {
			String keys = getOpenRouterKey(email);
			Object plugin = PluginLoader.loadAiService(pluginPath);

			if (plugin != null) {
				Method method = plugin.getClass().getMethod("callQwenAIAndStreamResponse", String.class,
						ResponseBodyEmitter.class, String.class);
				method.invoke(plugin, prompt, emitter, keys);
			} else {
				emitter.send("AI Plugin not available.");
				emitter.complete();
			}
		} catch (Exception e) {
			try {
				emitter.send("Error while invoking AI Plugin.");
			} catch (Exception ignored) {
			}
			emitter.completeWithError(e);
		}
	}

	public boolean isAiPluginAvailable() {
		File jarFile = new File(pluginPath);
		if (!jarFile.exists())
			return false;
		try {
			// Try to load the plugin class
			Object plugin = PluginLoader.loadAiService(pluginPath);
			return plugin != null;
		} catch (Exception e) {
			return false;
		}
	}
}
