package com.knowledgeVista.User.SecurityConfiguration;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Configuration
public class JwtUtil {

	@Autowired
	private JwtConfig jwtConfig;

	@Autowired
	private TokenBlacklist tokenBlacklist;

	private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

	public static final long JWT_EXPIRATION_MS = 6 * 60 * 60 * 1000; // 6 hours

	private Key getSigningKey() {
		byte[] secretBytes = jwtConfig.getSecretKey().getBytes(); // Your key should be 64+ bytes for HS512
		return new SecretKeySpec(secretBytes, SignatureAlgorithm.HS512.getJcaName());
	}

	public String generateToken(String username, String userRole, String institutionName, Long userId, String email) {
		Date now = new Date();
		Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION_MS);

		return Jwts.builder().setSubject(username).setIssuedAt(now).setExpiration(expiryDate)
				.claim("username", username).claim("email", email).claim("role", userRole)
				.claim("institution", institutionName).claim("userId", userId)
				.signWith(getSigningKey(), SignatureAlgorithm.HS512).compact();
	}

	public boolean validateToken(String token) {
		try {
			if (tokenBlacklist.isTokenBlacklisted(token))
				return false;

			Claims claims = extractAllClaims(token);
			return claims.getExpiration().after(new Date());
		} catch (Exception e) {
			logger.error("JWT validation failed", e);
			return false;
		}
	}

	public String refreshToken(String token) {
		try {
			Claims claims = extractAllClaims(token);
			return generateToken(claims.get("username", String.class), claims.get("role", String.class),
					claims.get("institution", String.class), claims.get("userId", Long.class),
					claims.get("email", String.class));
		} catch (Exception e) {
			logger.error("Error refreshing token", e);
			return null;
		}
	}

	public String getUsernameFromToken(String token) {
		return getClaim(token, claims -> claims.get("username", String.class));
	}

	public String getEmailFromToken(String token) {
		return getClaim(token, claims -> claims.get("email", String.class));
	}

	public String getInstitutionFromToken(String token) {
		return getClaim(token, claims -> claims.get("institution", String.class));
	}

	public String getRoleFromToken(String token) {
		return getClaim(token, claims -> claims.get("role", String.class));
	}

	public Long getUserIdFromToken(String token) {
		return getClaim(token, claims -> claims.get("userId", Long.class));
	}

	private <T> T getClaim(String token, Function<Claims, T> claimsResolver) {
		try {
			final Claims claims = extractAllClaims(token);
			return claimsResolver.apply(claims);
		} catch (Exception e) {
			logger.error("Error extracting claim", e);
			return null;
		}
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
	}
}
