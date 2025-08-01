package com.knowledgeVista.Migration;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Migration.model.OAuthCredential;
import com.knowledgeVista.Migration.repo.OAuthCredentialRepo;
import com.knowledgeVista.config.EncryptionUtil;

@Service
public class OAuthCredentialsService2 {

	@Autowired
	private OAuthCredentialRepo credentialRepository;
	@Autowired
	private EncryptionUtil encryptionUtil;
	private static final Logger logger = LoggerFactory.getLogger(OAuthCredentialsService2.class);
	// for calling

	public OAuthCredential getCredential(String institutionName) {
		try {

			Optional<OAuthCredential> optionalCredential = credentialRepository.findByInstitutionName(institutionName);

			if (optionalCredential.isPresent()) {
				OAuthCredential credential = optionalCredential.get();
				credential.setClientId(encryptionUtil.decrypt(credential.getClientId()));
				credential.setClientSecret(encryptionUtil.decrypt(credential.getClientSecret()));
				if (credential.getRefreshToken() != null) {
					credential.setRefreshToken(encryptionUtil.decrypt(credential.getRefreshToken()));
				}
				return credential;

			} else {
				return getFallbackCredential();
			}
		} catch (Exception e) {

			return null;
		}
	}

	private OAuthCredential getFallbackCredential() {
		Optional<OAuthCredential> optionalCredential = credentialRepository.getDefaultKeys();

		if (optionalCredential.isPresent()) {
			OAuthCredential credential = optionalCredential.get();
			try {
				credential.setClientId(encryptionUtil.decrypt(credential.getClientId()));
				credential.setClientSecret(encryptionUtil.decrypt(credential.getClientSecret()));
				if (credential.getRefreshToken() != null) {
					credential.setRefreshToken(encryptionUtil.decrypt(credential.getRefreshToken()));
				}
				return credential;
			} catch (Exception e) {
				logger.error("Error Getting Default Keys");
				return null;
			}

		} else {
			return null; // use default "Meganartech"
		}

	}

}
