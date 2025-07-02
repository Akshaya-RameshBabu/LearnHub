package com.knowledgeVista.User.SecurityConfiguration;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

	private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

	@Value("${spring.mail.username}")
	private String emailUsername;

	public void storeOtp(String email, String otp) {
		otpStorage.put(email, new OtpData(otp));
	}

	public boolean validateOtp(String email, String otp) {
		OtpData otpData = otpStorage.get(email);
		return otpData != null && otpData.isValid() && otpData.otp.equals(otp);
	}

	public void clearOtp(String email) {
		otpStorage.remove(email);
	}

	public String getEmailUsername() {
		return emailUsername;
	}

	public String generateOtpAndStore(String email) {
		String otp = String.format("%06d", new Random().nextInt(999999));
		storeOtp(email, otp);
		return otp;
	}

	private static class OtpData {
		private final String otp;
		private final LocalDateTime expiryTime;

		public OtpData(String otp) {
			this.otp = otp;
			this.expiryTime = LocalDateTime.now().plusMinutes(5);
		}

		public boolean isValid() {
			return LocalDateTime.now().isBefore(expiryTime);
		}
	}
}
